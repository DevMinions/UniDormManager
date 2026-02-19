Component({
  data: {
    selected: 0,
    list: [],
    userLevel: 1  // 默认学生角色
  },
  lifetimes: {
    ready() {
      // 获取用户角色并设置对应的 TabBar
      const app = getApp()
      const userLevel = app.globalData.userLevel || 1
      const tabBarList = this.getTabBarListByRole(userLevel)
      
      this.setData({
        list: tabBarList,
        selected: this.getTabIndex(tabBarList),
        userLevel: userLevel
      })
      
      console.log('TabBar 已初始化，角色等级:', userLevel, '列表:', tabBarList)
    },
    attached() {
      // 页面显示时检查是否需要更新
      this.checkAndUpdateTabBar()
    }
  },
  pageLifetimes: {
    show() {
      // 页面显示时检查是否需要更新 TabBar
      this.checkAndUpdateTabBar()
    }
  },
  methods: {
    /**
     * 检查并更新 TabBar
     */
    checkAndUpdateTabBar() {
      const app = getApp()
      const currentLevel = app.globalData.userLevel || 1
      
      // 如果角色发生变化，更新 TabBar
      if (currentLevel !== this.data.userLevel) {
        const tabBarList = this.getTabBarListByRole(currentLevel)
        this.setData({
          list: tabBarList,
          selected: this.getTabIndex(tabBarList),
          userLevel: currentLevel
        })
        console.log('TabBar 角色已切换:', currentLevel)
      }
    },
    
    /**
     * 根据用户角色获取 TabBar 列表
     */
    getTabBarListByRole(userLevel) {
      userLevel = userLevel || 1

      // 学生角色 (level 1)
      const studentTabs = [
        {
          pagePath: '/pages/index/index',
          text: '首页',
          iconPath: '/images/home.png',
          selectedIconPath: '/images/home-active.png'
        },
        {
          pagePath: '/pages/rooms/list',
          text: '房间',
          iconPath: '/images/room.png',
          selectedIconPath: '/images/room-active.png'
        },
        {
          pagePath: '/pages/repairs/list/index',
          text: '报修',
          iconPath: '/images/repair.png',
          selectedIconPath: '/images/repair-active.png'
        },
        {
          pagePath: '/pages/profile/index',
          text: '我的',
          iconPath: '/images/profile.png',
          selectedIconPath: '/images/profile-active.png'
        }
      ]

      // 宿管员角色 (level 2)
      const dormManagerTabs = [
        {
          pagePath: '/pages/index/index',
          text: '工作台',
          iconPath: '/images/workbench.png',
          selectedIconPath: '/images/workbench-active.png'
        },
        {
          pagePath: '/pages/rooms/list',
          text: '学生',
          iconPath: '/images/student.png',
          selectedIconPath: '/images/student-active.png'
        },
        {
          pagePath: '/pages/repairs/list/index',
          text: '报修',
          iconPath: '/images/repair.png',
          selectedIconPath: '/images/repair-active.png'
        },
        {
          pagePath: '/pages/profile/index',
          text: '我的',
          iconPath: '/images/profile.png',
          selectedIconPath: '/images/profile-active.png'
        }
      ]

      // 维修工角色 (level 3)
      const maintenanceTabs = [
        {
          pagePath: '/pages/index/index',
          text: '工单',
          iconPath: '/images/workbench.png',
          selectedIconPath: '/images/workbench-active.png'
        },
        {
          pagePath: '/pages/repairs/list/index',
          text: '待处理',
          iconPath: '/images/list.png',
          selectedIconPath: '/images/list-active.png'
        },
        {
          pagePath: '/pages/repairs/statistics/index',
          text: '统计',
          iconPath: '/images/chart.png',
          selectedIconPath: '/images/chart-active.png'
        },
        {
          pagePath: '/pages/profile/index',
          text: '我的',
          iconPath: '/images/profile.png',
          selectedIconPath: '/images/profile-active.png'
        }
      ]

      // 管理员角色 (level 4+)
      const adminTabs = [
        {
          pagePath: '/pages/index/index',
          text: '控制台',
          iconPath: '/images/workbench.png',
          selectedIconPath: '/images/workbench-active.png'
        },
        {
          pagePath: '/pages/rooms/list',
          text: '管理',
          iconPath: '/images/management.png',
          selectedIconPath: '/images/management-active.png'
        },
        {
          pagePath: '/pages/repairs/list/index',
          text: '报修',
          iconPath: '/images/repair.png',
          selectedIconPath: '/images/repair-active.png'
        },
        {
          pagePath: '/pages/profile/index',
          text: '我的',
          iconPath: '/images/profile.png',
          selectedIconPath: '/images/profile-active.png'
        }
      ]

      // 根据角色返回对应的 TabBar 配置
      if (userLevel === 1) {
        return studentTabs
      } else if (userLevel === 2) {
        return dormManagerTabs
      } else if (userLevel === 3) {
        return maintenanceTabs
      } else if (userLevel >= 4) {
        return adminTabs
      }

      return studentTabs
    },

    /**
     * 获取当前页面对应的 Tab 索引
     */
    getTabIndex(list) {
      const pages = getCurrentPages()
      const curPage = pages[pages.length - 1]
      if (!curPage) return 0
      
      const route = curPage.route
      list = list || this.data.list
      
      for (let i = 0; i < list.length; i++) {
        if (list[i].pagePath === route || list[i].pagePath === '/' + route) {
          return i
        }
      }
      return 0
    },
    
    /**
     * 切换 Tab
     */
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    },

    /**
     * 更新 TabBar（供外部调用）
     */
    updateTabBar(userLevel) {
      const tabBarList = this.getTabBarListByRole(userLevel)
      this.setData({
        list: tabBarList,
        selected: this.getTabIndex(tabBarList),
        userLevel: userLevel
      })
      console.log('TabBar 已更新为角色:', userLevel)
    }
  }
})
