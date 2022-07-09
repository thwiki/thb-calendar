<template>
  <div class="app-calendar">
    <calendar1 :userList="userList" />
    <div class="calendar-footer">
      <div class="events">
        <div class="chara"><span></span>纪念日</div>
        <div class="show"><span></span>展会活动</div>
        <div class="official"><span></span>官方活动</div>
      </div>
      <div class="more"><a href="/日程表" target="_blank" class="el-link el-link--primary">更多日程活动</a></div>
    </div>
  </div>
</template>

<script>
import calendar1 from "./components/calendar1.vue";

export default {
  name: "app-calendar",
  components: {
    calendar1,
  },
  data() {
    return {
      userList: []
    };
  },
  created() {
    let cdID = window.calendarInit();
    this.userList = window['cdData' + cdID] || [];
  },
};
</script>