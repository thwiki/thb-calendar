<template>
  <el-calendar v-model="currentDate">
    <template v-slot:dateCell="{ date, data }">
      <div :data-tmp="
          ((HD = getHoliday(data.day)),
          (events = eventListFromDay(data.day)),
          (ix = 0))
        "
           style="height: 100%"
      >
        <div :class="
            'day ' + ([0, 6].includes(date.getDay()) ? 'weekend ' : '') + (HD ? HD.status && (HD.status == '1' ? 'holiday' : 'work') : '')
          "
        >
          <span
              :class="
              'holiday-sign ' + (HD ? (HD.status == '1' ? 'rest' : 'work') : '')
            "
              v-text="HD ? HD.status && (HD.status == '1' ? '休' : '班') : ''"
          ></span>
          <span
              class="daynumber"
              v-text="data.day.split('-').slice(2).join('-')"
          ></span>
          <span class="term">{{ HD && HD.term }}</span>
          <template v-if="events.data.length > 0">
            <div class="events">
              <div
                  :class="'chara ' + (events.types.chara > 0 ? 'active' : '')"
                  v-show="events.types.chara > 0"
              >
                <span v-text="events.types.chara"></span>
              </div>
              <div
                  :class="'show ' + (events.types.show > 0 ? 'active' : '')"
                  v-show="events.types.show > 0"
              >
                <span v-text="events.types.show"></span>
              </div>
              <div
                  :class="
                  'official ' + (events.types.official > 0 ? 'active' : '')
                "
                  v-show="events.types.official > 0"
              >
                <span v-text="events.types.official"></span>
              </div>
            </div>
            <el-popover width="300" trigger="hover" placement="top-start">
              <template v-for="(eventsData, index) in events.data">
                <div :key="index">
                  <template v-for="(eventData, index2) in eventsData">
                    <div v-if="index2 == 0" :key="index2 + '_b'">
                      <strong
                          v-text="
                          eventData.startDate +
                          (eventData.startDate != eventData.endDate
                            ? '至' + eventData.endDate
                            : '')
                        "
                      ></strong
                      >：
                    </div>
                    <div :key="index2">
                      <strong
                      >{{ (ix = ix + 1) }}.{{
                          eventData.type ? eventData.type + "　" : ""
                        }}</strong
                      ><span v-html="eventData.desc"></span>　
                      <el-link
                          :href="'/' + eventData.event"
                          target="_blank"
                          :title="eventData.name"
                          type="primary"
                          style="float: right"
                      ><i class="el-icon-paperclip"></i>详情
                      </el-link
                      >
                    </div>
                  </template>
                </div>
              </template>
              <div class="eventBtn" slot="reference"></div>
            </el-popover>
          </template>
        </div>
      </div>
    </template>
  </el-calendar>
</template>
<script>
export default {
  name: "calendar1",
  data() {
    return {
      baiduDays: [],
      dateList: [],
      currentDate: new Date(),
    };
  },
  props: {
    userList: [],
  },
  watch: {
    currentDate(nVal, oVal) {
      if (
          nVal.getFullYear() != oVal.getFullYear() ||
          nVal.getMonth() != oVal.getMonth()
      ) {
        this.getBaiduDays(nVal);
        this.getEventDate(
            nVal
                .getMonthFirstDay()
                .addDays(-1)
                .getMonthFirstDay()
                .Format("yyyy-MM-dd"),
            nVal
                .getMonthLastDay()
                .addDays(1)
                .getMonthLastDay()
                .Format("yyyy-MM-dd")
        );
      }
    },
  },
  created() {
    this.getBaiduDays();
    this.getEventDate(
        this.currentDate
            .getMonthFirstDay()
            .addDays(-1)
            .getMonthFirstDay()
            .Format("yyyy-MM-dd"),
        this.currentDate
            .getMonthLastDay()
            .addDays(1)
            .getMonthLastDay()
            .Format("yyyy-MM-dd")
    );
  },
  methods: {
    getBaiduDays(date) {
      if (!date) date = this.currentDate;
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let _this = this;
      let t = new Date().getTime();
      this.jq.ajax({
        url: "https://sp1.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php",
        data: {
          tn: "wisetpl",
          format: "json",
          resource_id: 39043,
          query: year + "年" + month + "月",
          t: t,
        },
        dataType: "jsonp",
        jsonp: "cb",
        type: "get",
        success: function (ret) {
          if (ret.status == "0" && ret.data[0]) {
            let data = ret.data[0]["almanac"];
            // data = data.filter(function (v) {
            //     if (v.status) {
            //         return true;
            //     }
            //     return false;
            // });
            data = data.map(function (v) {
              let time = new Date(v.oDate).Format("yyyy-MM-dd");
              let lunarDate = v.lunarDate == "1" ? v.lMonth + "月" : v.lDate;
              return {
                startDate: time,
                endDate: time,
                event: "",
                desc: "",
                status: v.status || "",
                term: v.term ? v.term.split(" ")[0] : lunarDate,
              };
            });
            _this.baiduDays = data;
          }
        },
      });
    },
    getHoliday(day) {
      day = new Date(day + " GMT+0800");
      let hd = this.baiduDays.filter(function (v) {
        return (
            new Date(v.startDate + " GMT+0800") <= day &&
            new Date(v.endDate + " GMT+0800") >= day
        );
      });
      if (hd.length > 0) {
        return hd[0];
      }
      return null;
    },
    getEventDate(startDate, endDate) {
      let _this = this;
      if (this.userList.length > 0) {
        this.dateList = this.userList;
      } else {
        this.jq
            .ajax({
              url:
                  "https://calendar.thwiki.cc/events/" + startDate + "/" + endDate,
              dataType: "json",
            })
            .done(function (result) {
              _this.parseResult(result);
            });
      }
    },
    parseResult(result) {
      let eventData = [];
      if ("results" in result) {
        for (let i = 0; i < result.results.length; i++) {
          let item = result.results[i];
          //let wordName = item.id;
          let descElement = document.createElement("div");
          descElement.innerHTML = item.desc;
          descElement.querySelectorAll("a").forEach(function (a) {
            a.setAttribute("class", "el-link el-link--primary is-underline");
            a.style.marginTop = "-3px";
          });
          let desc = descElement.innerHTML;

          let event = item.url.replace("https://thwiki.cc/", "");
          let type = "";
          if ("type" in item && item.type.length > 0) {
            type = item.type[0];
          } else if (item.icon) {
            type = decodeURI(item.icon).replace(
                /.+\/文件:事件图标-(.*).svg/,
                "$1"
            );
          }
          eventData.push({
            name: item.title,
            startDate: item.startStr,
            endDate: item.endStr,
            desc,
            event,
            type,
          });
        }
      }
      this.dateList = window.groupBy(eventData, function (item) {
        return [item.startDate, item.endDate];
      });
    },
    eventListFromDay(day) {
      day = new Date(day + " GMT+0800");
      let events = this.dateList.filter(function (v) {
        v = v.filter(function (v1) {
          return (
              new Date(v1.startDate + " GMT+0800") <= day &&
              new Date(v1.endDate + " GMT+0800") >= day
          );
        });
        return v.length > 0;
      });
      let official = ["ZUN", "连载", "发售"];

      let types = {
        chara: 0,
        show: 0,
        official: 0,
      };

      events.forEach(function (v) {
        v = v.filter(function (v1) {
          let type = v1.type || "";
          return type === "纪念日";
        });
        types.chara += v.length;
      });

      events.forEach(function (v) {
        v = v.filter(function (v1) {
          let type = v1.type || "";
          return !official.includes(type) && type != "纪念日";
        });
        types.show += v.length;
      });

      events.forEach(function (v) {
        v = v.filter(function (v1) {
          let type = v1.type || "";
          return official.includes(type);
        });
        types.official += v.length;
      });

      let data = {
        types: types,
        data: events,
      };
      return data;
    },
  },
};
</script>
<style>
.app-calendar {
  box-sizing: border-box;
  padding: 1px;
  padding-top: 0px;
  background-image: linear-gradient(to left, #EEB158 0%, #F5A6E7 100%);
}

.app-calendar,
.el-calendar {
  border-radius: 10px;
}

.calendar-footer {
  width: 100%;
  font-size: 12px;
  background-color: #fff;
}

.el-calendar {
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
}

.calendar-footer {
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  position: relative;
}

.calendar-footer .events {
  padding: 5px;
  width: 60%;
  display: flex;
}

.calendar-footer div {
  width: 100%;
}

.calendar-footer .events div span {
  display: inline-block;
  border-radius: 40px;
  width: 12%;
  text-align: center;
  margin-right: 2px;
  height: 12px;
}

.calendar-footer .more {
  width: 40%;
}

.calendar-footer .more * {
  position: absolute;
  bottom: 4px;
  right: 2px;
  margin-right: 4px;
}

.el-calendar {
  background-image: linear-gradient(to left, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(https://thwiki.cc/logo.png);
  background-position: 100% 118%;
  background-repeat: no-repeat;
}

.el-calendar__header {
  /* height: 10px; */
  background-image: linear-gradient(to left, #EEB158 0%, #F5A6E7 100%);
  background-image: -webkit-linear-gradient(to left, #EEB158 0%, #F5A6E7 100%);
  background-image: -moz-linear-gradient(to left, #EEB158 0%, #F5A6E7 100%);
  background-size: 100% 20%;
  background-repeat: no-repeat;
  border-radius: 10px 10px 0px 0px;
  /* padding-top: 10px; */
  /* background-color: #eee; */
  border-bottom: 1px solid #F5A6E7;
  padding: 12px 20px 3px 20px;
}

.el-calendar__body {
  padding: 2px 0px 2px 0px;
}

.el-calendar-table thead th {
  padding: 2px 0 2px 0;
}

/* .el-calendar-table td {
    border-bottom: 1px solid #fff;
    border-right: 1px solid #fff;
} */

/* .el-calendar-table tr td:first-child {
    border-left: 1px solid #94979e;
}

.el-calendar-table tr td:last-child {
    border-right: 1px solid #94979e;
} */

/* .el-calendar-table tr:first-child td {
    border-top: 1px solid #fff;
} */

/* .el-calendar-table tr:last-child td {
    border-bottom: 1px solid #94979e;
} */

.el-calendar-table .el-calendar-day {
  padding: 0;
  height: 48px;
}

.day {
  display: flex;
  position: relative;
  /* justify-content: center; */
  align-content: center;
  align-items: center;
  flex-direction: column;
  /* border-radius: 6px; */
  cursor: pointer;
  width: 100%;
  height: 100%;
  /* padding: 4px 2px 2px 2px; */
  box-sizing: border-box;
  border: 2px solid transparent;
  overflow: hidden;
  line-height: 1;
  zoom: 1;
}

.day.holiday {
  background: #FDE3E4;
}

.day.work {
  background: #f5f5f6;
}

.el-calendar-table__row .prev,
.el-calendar-table__row .next {
  filter: alpha(opacity=40);
  opacity: 0.4;
}

.day:hover {
  border: 2px solid #BDBFC8;
}

.day.holiday:hover {
  border: 2px solid #F38686;
}

.day .holiday-sign {
  position: absolute;
  left: 0px;
  top: 0px;
  font-size: 12px;
  font-weight: bold;
  line-height: 12px;
}

.day .holiday-sign.rest {
  color: #F73131;
}

.day .holiday-sign.work {
  color: #575050;
}

.day .daynumber {
  font-size: 1em;
  font-weight: bold;
  color: #222222;
}

.day.holiday .daynumber,
.day.weekend .daynumber {
  color: #F73131;
}

.day .term {
  color: #333;
  font-size: 12px;
  height: 12px;
}

.day .eventBtn {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 95%;
}

.day .events {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-column-gap: 2px;
}

.day .events div {
  /* height: 8px; */
  width: 100%;
  margin: 0 auto;
}

.day .events div {
  color: transparent;
}

.day .events div.active {
  color: unset;
}

.day .events div span {
  display: block;
  width: 100%;
  text-align: center;
  font-size: 12px;
  /* transform: scale(0.8);
  -webkit-transform: scale(0.8);
  margin: 0 auto;
  margin-top: -5px; */
  border-radius: 40px;
}

.events .chara.active span,
.calendar-footer .events div.chara span {
  background-color: #ff9b9b;
  border: #ff464f 1px solid;
}

.events .jashow.active span,
.calendar-footer .events div.jashow span {
  background-color: #4be8ff;
  border: rgb(31, 169, 248) 1px solid;
}

.events .cnshow.active span,
.calendar-footer .events div.cnshow span {
  background-color: #fffdbe;
  border: #fff930 1px solid;
}

.events .show.active span,
.calendar-footer .events div.show span {
  background-color: #c6ffbe;
  border: #30ff75 1px solid;
}

.events .official.active span,
.calendar-footer .events div.official span {
  background-color: #ffbefc;
  border: #b330ff 1px solid;
}

@media screen and (max-width: 400px) {
  .day .holiday-sign {
    font-size: 8px;
  }

  .day .daynumber {
    font-size: 12px;
  }
}
</style>