Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "/images/home.png",
        selectedIconPath: "/images/home-active.png"
      },
      {
        pagePath: "/pages/rooms/list",
        text: "房间",
        iconPath: "/images/room.png",
        selectedIconPath: "/images/room-active.png"
      },
      {
        pagePath: "/pages/repairs/list/index",
        text: "报修",
        iconPath: "/images/repair.png",
        selectedIconPath: "/images/repair-active.png"
      },
      {
        pagePath: "/pages/profile/index",
        text: "我的",
        iconPath: "/images/profile.png",
        selectedIconPath: "/images/profile-active.png"
      }
    ]
  },
  lifetimes: {
    ready() {
      this.setData({
        selected: this.getTabIndex()
      })
    }
  },
  methods: {
    getTabIndex() {
      const pages = getCurrentPages()
      const curPage = pages[pages.length - 1]
      if (!curPage) return 0
      
      const route = curPage.route
      const list = this.data.list
      
      for (let i = 0; i < list.length; i++) {
        if (list[i].pagePath === route || list[i].pagePath === '/' + route) {
          return i
        }
      }
      return 0
    },
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    }
  }
})
