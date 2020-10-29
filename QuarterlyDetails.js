/**
 * 季度明细
 */
define([
    'product/oa/AccountManageForOA/AccountManageForOA',
    "gis/core/promiseUtils",
    'text!./PerformanceIndex.html',
    'text!./PerformanceStatistics.html',
], function (AccountManage, promiseUtils, PerformanceIndex, PerformanceStatistics) {
    var Widget = AccountManage.extend({
        events: {
            "click .performance-index .psn_normal": "changeTab",
            "change .performance-index #yearsSelector": "changeYears",
            "click .performance-index #exportTable": "export",
            "click .performance-statistics .filter-arrow": "openFilter",
            "click .performance-statistics .filter-item div": "select",
            "click .performance-statistics .clear-button": "clear",
            "click .performance-statistics .filter-footer #confirm": "confirm",
            "click .performance-statistics .filter-footer #cancel": "cancel"
        },

        widgetOpen: function () {
            this.$el.html(_.template(PerformanceIndex)({}));
            this._OAUrl = urlUtils.getUrl("CityInterface/rest/services/OA.svc");
            this.addScaleList = [];
            this.addBranchList = [];
            this.addMethodList = [];
            this.addIndustryList = [];
            this.selectedScaleList = [];
            this.selectedBranchList = [];
            this.selectedMethodList = [];
            this.selectedIndustryList = [];
            this.tab = "业绩明细";
            this.year = this.$el.find(".performance-index #yearsSelector").val();
            this.getPerformanceStatistics();
        },

        changeTab: function (e) {
            var tab = $(e.currentTarget).attr("name");
            this.tab = tab;
            $(e.currentTarget).siblings(".psn_normal").removeClass("psn_actived");
            $(e.currentTarget).addClass("psn_actived");
            switch (tab) {
                case "业绩明细":
                    this.year = (new Date).getFullYear();
                    this.$el.find("#yearsSelector").val((new Date).getFullYear());
                    this.getPerformanceStatistics();
                break;
            }
        },

        changeYears: function(e) {
            this.selectedScaleList = [];
            this.selectedBranchList = [];
            this.selectedMethodList = [];
            this.selectedIndustryList = [];
            this.year = $(e.currentTarget).val();
            if(this.tab === "业绩明细") {
                this.getPerformanceStatistics();
            }
        },

        getPerformanceStatistics: function() {
            var me = this;
            var queryObj = {
                year: me.year
            }
            var selectedScaleList = me.selectedScaleList.filter(item => { return item !== "全部"});
            var selectedBranchList = me.selectedBranchList.filter(item => { return item !== "全部"});
            var selectedMethodList = me.selectedMethodList.filter(item => { return item !== "全部"});
            var selectedIndustryList = me.selectedIndustryList.filter(item => { return item !== "全部"});
            var selectedScales = selectedScaleList.map(item => { return  "'" + item + "'"});
            var selectedBranches = selectedBranchList.map(item => { return  "'" + item + "'"});
            var selectedMethods = selectedMethodList.map(item => { return  "'" + item + "'"});
            var selectedIndustries = selectedIndustryList.map(item => { return  "'" + item + "'"});
            var queryObject = {
                scales: me.selectedScaleList.indexOf("全部") === -1 ? selectedScales.join(",") : "",
                branches: me.selectedBranchList.indexOf("全部") === -1 ? selectedBranches.join(",") : "",
                methods: me.selectedMethodList.indexOf("全部") === -1 ? selectedMethods.join(",") : "",
                industries: me.selectedIndustryList.indexOf("全部") === -1 ? selectedIndustries.join(",") : "",
                year: me.year
            }
            msgUtils.loading(me.$el)
            var getScales = request(me._OAUrl + "/GetScaleDropDownList", {
                query: queryObj
            }).then(function (res) {
                var data = res.data.getMe;
                if(data && data.length > 0) {
                    me.scales = data;
                } else {
                    me.scales = [];
                }
            });

            var getBranches = request(me._OAUrl + "/GetBranchDropDownList", {
                query: queryObj
            }).then(function (res) {
                var data = res.data.getMe;
                if(data && data.length > 0) {
                    me.branches = data;
                } else {
                    me.branches = [];
                }
            });

            var getMethods = request(me._OAUrl + "/GetSigningMethodDropDownList", {
                query: queryObj
            }).then(function (res) {
                var data = res.data.getMe;
                if(data && data.length > 0) {
                    me.methods = data;
                } else {
                    me.methods = [];
                }
            });

            var getIndustry = request(me._OAUrl + "/GetIndustryDropDownList", {
                query: queryObj
            }).then(function (res) {
                var data = res.data.getMe;
                if(data && data.length > 0) {
                    me.industries = data;
                } else {
                    me.industries = [];
                }
            })
            var requestArray = [getScales, getBranches, getMethods, getIndustry];
            promiseUtils.eachAlways(requestArray).then(function() {
                request(me._OAUrl + "/GetPerformanceStatistics", {
                    query: queryObject
                }).then(function (res) {
                    var data = res.data.getMe;
                    me.data = data;
                    if(data.QuarterPerformancesList && data.QuarterPerformancesList.length > 0) {
                        me.$el.find("#tableContainer2").empty().html(_.template(PerformanceStatistics)({
                            data: data,
                            scales: me.scales,
                            branches: me.branches,
                            methods: me.methods,
                            industries: me.industries
                        }));
                        for(var i = 0; i < me.selectedScaleList.length; i ++) {
                            me.$el.find(`.performance-statistics #scale .filter-item #${ me.selectedScaleList[i] }`).append('<img src="assets/images/oa/filter_selected.png"></img>');
                        }
                        for(var j = 0; j < me.selectedBranchList.length; j ++) {
                            me.$el.find(`.performance-statistics #branch .filter-item #${ me.selectedBranchList[j] }`).append('<img src="assets/images/oa/filter_selected.png"></img>');
                        }
                        for(var k = 0; k < me.selectedMethodList.length; k ++) {
                            me.$el.find(`.performance-statistics #method .filter-item #${ me.selectedMethodList[k] }`).append('<img src="assets/images/oa/filter_selected.png"></img>');
                        }
                        for(var l = 0; l < me.selectedIndustryList.length; l ++) {
                            me.$el.find(`.performance-statistics #industry .filter-item #${ me.selectedIndustryList[l] }`).append('<img src="assets/images/oa/filter_selected.png"></img>');
                        }

                        msgUtils.unloading(me.$el);
                    } else {
                        msgUtils.noResult(me.$el.find("#tableContainer2"));
                        msgUtils.unloading(me.$el);
                    }
                });
            })
        },

        export: function () {
            var data = this.data;
            var exportData = [];
            var list = data.QuarterPerformancesList;
            if(list && list.length > 0) {
                for(var i = 0; i < list.length; i ++) {
                    var projectList = list[i].PerformanceStatisticsList;
                    for(var j = 0; j < projectList.length; j ++) {
                        projectList[j].Quarter = "第" + list[i].Name + "季度";
                        projectList[j].Month = projectList[j].Month + "月";
                        exportData.push(projectList[j]);
                    }
                    exportData.push({
                        Quarter: "本季度签单数",
                        Month: list[i].NumberOfOrder + "个",
                        ProductCategory: "合同额小计",
                        TheAmountOfWisdomWater: list[i].SubtotalOfContractAmount
                    })
                }
                exportData.push({
                    Quarter: "总计项目",
                    Month: data.Total$(e.currentTarget).parents(".filter-main").find(".filter-item div") + "个",
                    ProductCategory: "总计合同额",
                    TheAmountOfWisdomWater: data.TotalContractAmount
                })
            }
            exportData.forEach(function (item) {
                item["季度"] = item["Quarter"] ? item["Quarter"] : " ";
                item["月份"] = item["Month"] ? item["Month"] : " ";
                item["名称"] = item["Name"] ? item["Name"] : " ";
                item["规模"] = item["Scale"] ? item["Scale"] : " ";
                item["分公司"] = item["BranchCompany"] ? item["BranchCompany"] : " ";
                item["签单方式"] = item["SigningMethod"] ? item["SigningMethod"] : " ";
                item["产品类别"] = item["ProductCategory"] ? item["ProductCategory"] : " ";
                item["智慧水务金额"] = item["TheAmountOfWisdomWater"] ? item["TheAmountOfWisdomWater"] : " ";
                item["所属行业"] = item["Industry"] ? item["Industry"] : " ";
                item["支撑售前"] = item["SupportPresales"] ? item["SupportPresales"] : " ";
                item["签单主体"] = item["SigningSubject"] ? item["SigningSubject"] : " ";
            });
            if(exportData && exportData.length){
                var fileName = [
                    { "alias": "季度", "name": "季度" },
                    { "alias": "月份", "name": "月份" },
                    { "alias": "名称", "name": "名称" },
                    { "alias": "规模", "name": "规模" },
                    { "alias": "分公司", "name": "分公司" },
                    { "alias": "签单方式", "name": "签单方式" },
                    { "alias": "产品类别", "name": "产品类别" },
                    { "alias": "智慧水务金额 (元)", "name": "智慧水务金额" },
                    { "alias": "所属行业", "name": "所属行业" },
                    { "alias": "支撑售前", "name": "支撑售前" },
                    { "alias": "签单主体", "name": "签单主体" },
                ];
                wgtUtils.exportCSV({
                    fileName: "业绩明细表",
                    fields: fileName,
                    datas: exportData
                },"xls");
            }else{
                msgUtils.warning("无数据无法导出！");
            }
        },

        openFilter: function(e) {
            var me = this;
            var openId = $(e.currentTarget).attr("id");
            this.openType = openId;
            this.$el.find(`.performance-statistics #${ openId }`).next().show();

            $(e.currentTarget).attr("src", "assets/images/oa/filter_dark.svg");

            //添加点击事件监听器
            document.addEventListener("mousedown", function (e) {
                var target = e.target || e.srcElement;
                var id = target.getAttribute("id");
                while (target != document) {
                    if(target.getAttribute("class") == "filter-container") {
                        return;
                    }
                    target = target.parentNode;
                }
                if (id != openId) {
                    if(me.$el.find(`.performance-statistics #${ openId }`).next().is(':hidden')) {

                    } else {
                        me.cancel();
                        this.$el.find(`.performance-statistics #${ openId }`).next().hide();
                        this.$el.find(`.performance-statistics #${ openId }`).attr("src", "assets/images/oa/filter_arrow_down.svg");
                    }
                }
            }.bind(this), false);
        },

        select: function(e) {
            var list = null;
            switch (this.openType) {
                case "scale":
                    list = this.addScaleList;
                    break;
                case "branch":
                    list = this.addBranchList;
                    break;
                case "method":
                    list = this.addMethodList;
                    break;
                default:
                    list = this.addIndustryList;
                    break;
            }
            var children = $(e.currentTarget).children();
            if(children.length > 0) {
                if($(e.currentTarget).attr("id") == "全部") {
                    for(var i = 0; i < $(e.currentTarget).parents(".filter-main").find(".filter-item div").length; i ++) {
                        $(e.currentTarget).parents(".filter-main").find(".filter-item div").eq(i).empty();
                    }
                    list = [];
                } else {
                    $(e.currentTarget).empty();
                    for(var j = 0; j < list.length; j ++) {
                        if(list[j] == $(e.currentTarget).attr("id")) {
                            list.splice(j, 1);
                        }
                    }
                }
            } else {
                if($(e.currentTarget).attr("id") == "全部") {
                    for(var k = 0; k < $(e.currentTarget).parents(".filter-main").find(".filter-item div").length; k ++) {
                        $(e.currentTarget).parents(".filter-main").find(".filter-item div").eq(k).empty();
                        list.push($(e.currentTarget).parents(".filter-main").find(".filter-item div").eq(k).attr("id"));
                        $(e.currentTarget).parents(".filter-main").find(".filter-item div").eq(k).append('<img src="assets/images/oa/filter_selected.png"></img>');
                    }
                } else {
                    $(e.currentTarget).append('<img src="assets/images/oa/filter_selected.png"></img>');
                    list.push($(e.currentTarget).attr("id"));
                }
            }
            switch (this.openType) {
                case "scale":
                    this.addScaleList = Array.from(new Set(list));
                    break;
                case "branch":
                    this.addBranchList = Array.from(new Set(list));
                    break;
                case "method":
                    this.addMethodList = Array.from(new Set(list));
                    break;
                default:
                    this.addIndustryList = Array.from(new Set(list));
                    break;
            }
        },

        clear: function(e) {
            $(e.currentTarget).parents(".filter-container").find(".filter-item div").empty();
            this.$el.find(`.performance-statistics #${ this.openType }`).next().hide();
            switch (this.openType) {
                case "scale":
                    this.selectedScaleList = [];
                    this.getPerformanceStatistics();
                    break;
                case "branch":
                    this.selectedBranchList = [];
                    this.getPerformanceStatistics();
                    break;
                case "method":
                    this.selectedMethodList = [];
                    this.getPerformanceStatistics();
                    break;
                default:
                    this.selectedIndustryList = [];
                    this.getPerformanceStatistics();
                    break;
            }
        },

        confirm: function() {
            switch (this.openType) {
                case "scale":
                    this.selectedScaleList = this.addScaleList.concat();
                    break;
                case "branch":
                    this.selectedBranchList = this.addBranchList.concat();
                    break;
                case "method":
                    this.selectedMethodList = this.addMethodList.concat();
                    break;
                default:
                    this.selectedIndustryList = this.addIndustryList.concat();
                    break;
            }
            this.getPerformanceStatistics();
            this.$el.find(`.performance-statistics #${ this.openType }`).next().hide();
            this.$el.find(`.performance-statistics #${ this.openType }`).attr("src", "assets/images/oa/filter_arrow_down.svg");
        },

        cancel: function() {
            this.getPerformanceStatistics();
            this.$el.find(`.performance-statistics #${ this.openType }`).next().hide();
            this.$el.find(`.performance-statistics #${ this.openType }`).attr("src", "assets/images/oa/filter_arrow_down.svg");
        }
    })
    return Widget;
});

