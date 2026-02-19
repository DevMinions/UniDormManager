Component({
  /**
   * 组件的属性列表
   */
  properties: {
    
  },

  /**
   * 组件的初始数据
   */
  data: {
    selected: 0,
    // 默认显示学生 TabBar，避免空数组导致不渲染
    tabBarList: [
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
    ],
    safeAreaBottom: 0
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      console.log('=== TabBar attached ===')
      
      // 获取安全区域底部高度
      const systemInfo = wx.getSystemInfoSync()
      const safeAreaBottom = systemInfo.safeArea ? 
        (systemInfo.screenHeight - systemInfo.safeArea.bottom) : 0
      
      // 获取 TabBar 列表
      const tabBarList = this.getTabBarList()
      console.log('TabBar list:', tabBarList)
      console.log('TabBar list length:', tabBarList.length)
      
      this.setData({ 
        safeAreaBottom,
        tabBarList: tabBarList.length > 0 ? tabBarList : this.data.tabBarList
      })
      
      console.log('TabBar data set:', this.data)
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 根据用户角色获取 TabBar 列表
     */
    getTabBarList() {
      const app = getApp()
      const userRole = app.globalData.userRole
      const userLevel = app.globalData.userLevel || 1

      // 学生角色 (level 1)
      const studentTabs = [
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

      // 宿管员角色 (level 2)
      const dormManagerTabs = [
        {
          pagePath: "/pages/index/index",
          text: "工作台",
          iconPath: "/images/workbench.png",
          selectedIconPath: "/images/workbench-active.png"
        },
        {
          pagePath: "/pages/rooms/list",
          text: "学生",
          iconPath: "/images/student.png",
          selectedIconPath: "/images/student-active.png"
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

      // 维修工角色 (level 3)
      const maintenanceTabs = [
        {
          pagePath: "/pages/index/index",
          text: "工单",
          iconPath: "/images/workbench.png",
          selectedIconPath: "/images/workbench-active.png"
        },
        {
          pagePath: "/pages/repairs/list/index",
          text: "待处理",
          iconPath: "/images/list.png",
          selectedIconPath: "/images/list-active.png"
        },
        {
          pagePath: "/pages/profile/index",
          text: "统计",
          iconPath: "/images/chart.png",
          selectedIconPath: "/images/chart-active.png"
        },
        {
          pagePath: "/pages/profile/index",
          text: "我的",
          iconPath: "/images/profile.png",
          selectedIconPath: "/images/profile-active.png"
        }
      ]

      // 管理员角色 (level 4+)
      const adminTabs = [
        {
          pagePath: "/pages/index/index",
          text: "控制台",
          iconPath: "/images/workbench.png",
          selectedIconPath: "/images/workbench-active.png"
        },
        {
          pagePath: "/pages/rooms/list",
          text: "管理",
          iconPath: "/images/management.png",
          selectedIconPath: "/images/management-active.png"
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
     * TabBar 切换事件
     */
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      
      // 更新选中状态
      this.setData({
        selected: index
      })

      // 跳转页面
      wx.switchTab({
        url: path
      })
    },

    /**
     * 设置选中的 Tab（供页面调用）
     */
    setSelected(index) {
      this.setData({
        selected: index
      })
    }
  }
})
