<template>
  <div style="background-color: #fff">
    <div class="monthSel">
      <div>日历</div>
      <el-date-picker
        v-model="currentDate"
        type="month"
        placeholder="选择月"
        size="mini"
        :clearable="false"
        align="right"
        :editable="false"
      >
      </el-date-picker>
    </div>
    <el-calendar v-model="currentDate">
      <template v-slot:dateCell="{ date, data }">
        <div
          :data-tmp="
            ((HD = getHoliday(data.day)),
            (events = eventListFromDay(data.day)),
            (ix = 0))
          "
          style="height: 100%"
        >
          <div
            :class="
              'day ' +
              ([0, 6].includes(date.getDay()) ? 'weekend ' : '') +
              (HD ? HD.status && (HD.status == '1' ? 'holiday' : 'work') : '')
            "
          >
            <span
              :class="
                'holiday-sign ' +
                (HD ? (HD.status == '1' ? 'rest' : 'work') : '')
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
                        </el-link>
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
  </div>
</template>
<script>
import axios from "axios";
import jsonp from "jsonp";
export default {
  name: "calendar1",
  data() {
    return {
      baiduDays: [],
      dateList: [],
      currentDate: new Date(),
      datePickerOptions: {
        shortcuts: [
          {
            text: "今年当月",
            onClick(picker) {
              picker.$emit("pick", new Date());
            },
          },
        ],
      },
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
        const { firstDay, lastDay } = this.getMonthRange(nVal);
        this.getEventDate(firstDay, lastDay);
      }
    },
  },
  created() {
    this.getBaiduDays();
    const { firstDay, lastDay } = this.getMonthRange(this.currentDate);
    this.getEventDate(firstDay, lastDay);
  },
  methods: {
    getMonthRange(date) {
      let firstDay = date.getMonthFirstDay().addDays(-6).Format("yyyy-MM-dd");
      let lastDay = date.getMonthLastDay().addDays(6).Format("yyyy-MM-dd");
      return { firstDay, lastDay };
    },
    getBaiduDays(date) {
      if (!date) date = this.currentDate;
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let _this = this;
      let t = new Date().getTime();
      jsonp(
        `https://sp1.baidu.com/8aQDcjqpAAV3otqbppnN2DJv/api.php?tn=wisetpl&format=json&resource_id=39043&query=${year}年${month}月&t=${t}`,
        { param: "cb" },
        (err, ret) => {
          if (ret.status == "0" && ret.data.length > 0) {
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
        }
      );
    },
    getHoliday(day) {
      day = new Date(day + " 00:00+08:00").getTime();
      let hd = this.baiduDays.filter(function (v) {
        let startDate = new Date(v.startDate + " 00:00+08:00").getTime();
        let endDate = new Date(v.endDate + " 00:00+08:00").getTime();
        return startDate <= day && endDate >= day;
      });
      return hd.length > 0 ? hd[0] : null;
    },
    getEventDate(startDate, endDate) {
      if (this.userList.length > 0) {
        this.dateList = this.userList;
      } else {
        axios
          .get(`${window.calendarAPIUrl}/${startDate}/${endDate}`)
          .then((ret) => {
            this.parseResult(ret.data);
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
      day = new Date(day + " 00:00+08:00").getTime();
      let events = this.dateList.filter(function (v) {
        v = v.filter(function (v1) {
          let startDate = new Date(v1.startDate + " 00:00+08:00").getTime();
          let endDate = new Date(v1.endDate + " 00:00+08:00").getTime();
          return startDate <= day && endDate >= day;
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
:root {
  --calendar-back-color: initial;
  --calendar-font-color: initial;
  --calendar-footer-back-color: #fff;
  --calendar-link-color: #409eff;

  /* day */
  --calendar-day-holiday-color: #fde3e4;
  --calendar-day-work-color: #f5f5f6;

  --calendar-day-hover-color: #bdbfc8;
  --calendar-day-hover-holiday-color: #f38686;

  --calendar-day-sign-holiday-color: #f73131;
  --calendar-day-sign-work-color: #575050;

  --calendar-day-number-color: #222222;
  --calendar-day-sign-number-color: #f73131;

  --calendar-day-term-color: #333;

  /* events */
  --calendar-events-chara-color: #ff9b9b;
  --calendar-events-jashow-color: #4be8ff;
  --calendar-events-cnshow-color: #fffdbe;
  --calendar-events-show-color: #c6ffbe;
  --calendar-events-official-color: #ffbefc;
}

.skin-vampire {
  --calendar-back-color: #242526;
  --calendar-font-color: #ccc;
  --calendar-footer-back-color: #242526;
  --calendar-link-color: #87ace8;

  /* day */

  --calendar-day-holiday-color: #643234;
  --calendar-day-work-color: #727275;

  --calendar-day-hover-color: #bdbfc8;
  --calendar-day-hover-holiday-color: #f38686;

  --calendar-day-sign-holiday-color: #dd6161;
  --calendar-day-sign-work-color: #c8bebe;

  --calendar-day-number-color: rgb(255 255 255 / 50%);
  --calendar-day-sign-number-color: #dd6161;

  --calendar-day-term-color: #aaa9a9;

  /* events */
  --calendar-events-chara-color: #e91e63;
  --calendar-events-jashow-color: #4be8ff;
  --calendar-events-cnshow-color: #fffdbe;
  --calendar-events-show-color: #009688;
  --calendar-events-official-color: #9c27b0;
}

.app-calendar {
  box-sizing: border-box;
  padding: 1px;
  padding-top: 0px;
  background-image: linear-gradient(to left, #eeb158 0%, #f5a6e7 100%);
  border-radius: 10px;
}

.calendar-footer {
  width: 100%;
  font-size: 12px;
  background-color: var(--calendar-footer-back-color);
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  position: relative;
}

.calendar-footer .events {
  padding: 5px;
  width: 60%;
  display: flex;
  color: var(--calendar-font-color);
}

.calendar-footer div {
  width: 100%;
  display: flex;
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
  background-image: linear-gradient(
      to left,
      rgba(255, 255, 255, 0.85),
      rgba(255, 255, 255, 0.85)
    ),
    url(https://static.thwiki.cc/logo.png);
  background-position: 100% 118%;
  background-repeat: no-repeat;
}

.el-calendar__header {
  /* background-image: linear-gradient(to left, #eeb158 0%, #f5a6e7 100%);
  background-image: -webkit-linear-gradient(to left, #eeb158 0%, #f5a6e7 100%);
  background-image: -moz-linear-gradient(to left, #eeb158 0%, #f5a6e7 100%);
  background-size: 100% 20%;
  background-repeat: no-repeat;
  border-radius: 10px 10px 0px 0px; */
  background-color: var(--calendar-back-color);
  border-bottom: 1px solid #f5a6e7;
  padding: 5px 20px 3px 20px;
}

.el-calendar__title {
  color: var(--calendar-font-color);
}

.el-calendar__body {
  padding: 2px 0px 2px 0px;
}

.el-calendar-table thead th {
  padding: 2px 0 2px 0;
}

.el-calendar-table .el-calendar-day {
  padding: 0;
  height: 48px;
}

.day {
  display: flex;
  position: relative;
  align-content: center;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 2px solid transparent;
  overflow: hidden;
  line-height: 1;
  zoom: 1;
}

.day.holiday {
  background: var(--calendar-day-holiday-color);
}

.day.work {
  background: var(--calendar-day-work-color);
}

.el-calendar-table__row .prev,
.el-calendar-table__row .next {
  filter: alpha(opacity=40);
  opacity: 0.4;
}

.el-calendar-table__row .prev .events,
.el-calendar-table__row .next .events,
.el-calendar-table__row .next .el-popover__reference-wrapper,
.el-calendar-table__row .next .el-popover__reference-wrapper {
  display: none;
}

.day:hover {
  border: 2px solid #bdbfc8;
}

.day.holiday:hover {
  border: 2px solid #f38686;
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
  color: var(--calendar-day-sign-holiday-color);
}

.day .holiday-sign.work {
  color: var(--calendar-day-sign-work-color);
}

.day .daynumber {
  font-size: 1em;
  font-weight: bold;
  color: var(--calendar-day-number-color);
}

.day.holiday .daynumber,
.day.weekend .daynumber {
  color: var(--calendar-day-sign-number-color);
}

.day .term {
  color: var(--calendar-day-term-color);
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
  border-radius: 40px;
}

.events .chara.active span,
.calendar-footer .events div.chara span {
  background-color: var(--calendar-events-chara-color);
  border: #ff464f 1px solid;
}

.events .jashow.active span,
.calendar-footer .events div.jashow span {
  background-color: var(--calendar-events-jashow-color);
  border: rgb(31, 169, 248) 1px solid;
}

.events .cnshow.active span,
.calendar-footer .events div.cnshow span {
  background-color: var(--calendar-events-cnshow-color);
  border: #fff930 1px solid;
}

.events .show.active span,
.calendar-footer .events div.show span {
  background-color: var(--calendar-events-show-color);
  border: #30ff75 1px solid;
}

.events .official.active span,
.calendar-footer .events div.official span {
  background-color: var(--calendar-events-official-color);
  border: #b330ff 1px solid;
}

.el-link.el-link--primary {
  color: var(--calendar-link-color);
}

.el-popover {
  color: var(--calendar-font-color);
  background: var(--calendar-footer-back-color);
}

@media screen and (max-width: 400px) {
  .day .holiday-sign {
    font-size: 8px;
  }

  .day .daynumber {
    font-size: 12px;
  }
}

.monthSel {
  display: flex;
  justify-content: space-between;
  background-color: var(--calendar-back-color);
  color: var(--calendar-font-color);
  align-items: center;
  padding: 0px 20px;
  padding-top: 15px;
  background-image: linear-gradient(to left, #eeb158 0%, #f5a6e7 100%);
  background-image: -webkit-linear-gradient(to left, #eeb158 0%, #f5a6e7 100%);
  background-image: -moz-linear-gradient(to left, #eeb158 0%, #f5a6e7 100%);
  background-size: 100% 20%;
  background-repeat: no-repeat;
  border-radius: 10px 10px 0px 0px;
}

.skin-vampire .el-button,
.skin-vampire .el-picker-panel,
.skin-vampire .el-input__inner {
  background: var(--calendar-back-color);
  color: var(--calendar-font-color);
}

.skin-vampire .el-button:focus,
.skin-vampire .el-button:hover {
  color: #fff;
  background-color: #000;
}

.skin-vampire .el-calendar__body {
  background: var(--calendar-back-color);
}

.skin-vampire .el-calendar-table .el-calendar-day:hover,
.skin-vampire .el-calendar-table td.is-selected {
  background-color: #63676e;
}

.skin-vampire .el-calendar-table thead th {
  color: #c4c9d3;
}

.skin-vampire .el-picker-panel__icon-btn {
  color: #606266;
}

.skin-vampire .el-date-picker__header-label.active,
.skin-vampire .el-date-picker__header-label:hover,
.skin-vampire .el-year-table td .cell:hover,
.skin-vampire .el-year-table td.current:not(.disabled) .cell,
.skin-vampire .el-year-table td.today .cell,
.skin-vampire .el-month-table td.today .cell,
.skin-vampire .el-month-table td.current:not(.disabled) .cell,
.skin-vampire .el-month-table td .cell:hover {
  color: var(--calendar-link-color);
}
</style>
