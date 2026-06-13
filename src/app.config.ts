export default defineAppConfig({
  pages: [
    'pages/outfit/index',
    'pages/shoes/index',
    'pages/care/index',
    'pages/weather/index',
    'pages/stats/index',
    'pages/add-shoe/index',
    'pages/shoe-detail/index',
    'pages/monthly-report/index',
    'pages/care-record/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '球鞋管家',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f8f9fa'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#FF6B35',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/outfit/index',
        text: '今日穿搭'
      },
      {
        pagePath: 'pages/shoes/index',
        text: '鞋柜'
      },
      {
        pagePath: 'pages/care/index',
        text: '保养'
      },
      {
        pagePath: 'pages/weather/index',
        text: '天气'
      },
      {
        pagePath: 'pages/stats/index',
        text: '统计'
      }
    ]
  }
})
