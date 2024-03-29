var clubApp = angular.module('clubApp', ['ngRoute', 'infinite-scroll']);

clubApp.config(function($routeProvider, $locationProvider) {
	$routeProvider
			.when('/clubs/home', {
				templateUrl: 'clubs/home.html?' + new Date().getTime(),
				controller: 'clubController',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						$('.modal').modal('hide');
						return ClubService.getClub($route.current.params["club_eng"], true);
					}
				}
			})
			.when('/clubs/anninfo', {
				templateUrl: 'clubs/anninfo.html?' + new Date().getTime(),
				controller: 'annController',
				resolve: {
					ann: function($route, ClubService) {
						return ClubService.getAnn($route.current.params["id"]);
					}
				}
			})
			.when('/clubs/intro', {
				templateUrl: 'clubs/intro.html?' + new Date().getTime(),
				controller: 'clubIntroController',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						if ($rootScope.club) {
							return $rootScope.club;
						} else {
							return ClubService.getClubBase($route.current.params["club_eng"]);
						}
					}
				}
			})
			.when('/clubs/regulations', {
				templateUrl: 'clubs/regulations.html?' + new Date().getTime(),
				controller: 'clubRegulationsController',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						if ($rootScope.club) {
							return $rootScope.club;
						} else {
							return ClubService.getClubBase($route.current.params["club_eng"]);
						}
					}
				}
			})
			.when('/clubs/members', {
				templateUrl: 'clubs/members.html?' + new Date().getTime(),
				controller: 'clubMembersController',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						return ClubService.getClubBaseWithInfo($route.current.params["club_eng"]);
					}
				}
			})
			.when('/clubs/register', {
				templateUrl: 'clubs/register.html?' + new Date().getTime(),
				controller: 'clubRegisterController',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						if ($rootScope.club) {
							return $rootScope.club;
						} else {
							return ClubService.getClubBase($route.current.params["club_eng"]);
						}
					},
					member: function($route, ClubService) {
						$member = ClubService.clubmember($route.current.params["club_eng"]);
						return $member;
					},
					script: function($rootScope, UtilService) {
						UtilService.createFileUploadScript();
					}
				}
			})
			.when('/clubs/search', {
				templateUrl: 'clubs/clubs.html?' + new Date().getTime(),
				controller: 'SearchClubsContorller'
			})
			.when('/clubs/mileages', {
				templateUrl: 'clubs/mileages.html',
				controller: 'ClubMileagesContorller',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						$rootScope.mileage_type = 'run';
						return ClubService.getBaseMileages($route.current.params["club_eng"], 'run');
					}
				}
			})
			.when('/clubs/walks', {
				templateUrl: 'clubs/mileages.html',
				controller: 'ClubMileagesContorller',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						$rootScope.mileage_type = 'walk';
						return ClubService.getBaseMileages($route.current.params["club_eng"], 'walk');
					}
				}
			})
			.when('/clubs/rank', {
				templateUrl: 'clubs/ranklist.html',
				controller: 'ClubRankContorller',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						if ($rootScope.club) {
							return $rootScope.club;
						} else {
							return ClubService.getClubBase($route.current.params["club_eng"]);
						}
					}
				}
			})
			.when('/clubs/recent', {
				templateUrl: 'clubs/mileageslist.html',
				controller: 'ClubRecentMileagesContorller',
				resolve: {
					club: function($route, ClubService, $rootScope) {
						if ($rootScope.club) {
							return $rootScope.club;
						} else {
							return ClubService.getClubBase($route.current.params["club_eng"]);
						}
					}
				}
			})
			.otherwise({
				templateUrl: "/wechat/notfound.html"
			});
});

clubApp.factory('ClubService', function($http, $q, $rootScope, UtilService) {
	var service = {
		searchKey: null,
		type: 'seven',
		getClub: function(club_eng, async) {
			var deferred = $q.defer();
			store.remove("act_clicks");
			$.ajax({
				url: "/clubs/" + club_eng + "/clubinfo",
				data: {member_start_time: UtilService.getLocalClubMemberDate(club_eng), act_start_time: UtilService.getLocalActivityDate(club_eng), openid: $rootScope.openid},
				async: async,
				success: function(data) {
					if (data.club.club_slogan && $.trim(data.club.club_slogan) != "") {
						data.club.slogan_display = "block";
					} else {
						data.club.slogan_display = "none";
					}
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		getChartData: function(club_eng, club_id, type) {
			myChart.showLoading();
			$.post("/clubs/" + club_eng + "/chartdata?t=" + new Date().getTime(), {clubid: club_id, type: type}, function(data, status, req) {
				option.xAxis[0].data = $.parseJSON(data.xAxis);
				option.series[0].data = $.parseJSON(data.series);
				myChart.clear();
				myChart.setOption(option);
				myChart.hideLoading();
			});
		},
		getClubBase: function(club_eng, async) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/" + club_eng + "/getclub?t=" + new Date().getTime(),
				data: {club_eng: club_eng},
				async: async,
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		getClubBaseWithInfo: function(club_eng) {
			var deferred = $q.defer();
			$.post("/clubs/" + club_eng + "/getclubwithinfo?t=" + new Date().getTime(), {club_eng: club_eng}, function(data, status, req) {
				deferred.resolve(data);
			});
			return deferred.promise;
		},
		checkMember: function(club_eng, member, async) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/checkmember",
				data: {club_eng: club_eng, openid: $rootScope.openid},
				async: async,
				success: function(data) {
					member.join = data.member;
					member.bindCell = data.bindCell;
					member.roleError = data.role_error;
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		clubmember: function(club_eng) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/" + club_eng + "/clubmember",
				data: {openid: $rootScope.openid},
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		getMembers: function(club_eng, offset, limit) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/" + club_eng + "/getmembers",
				data: {openid: $rootScope.openid, offset: offset, limit: limit},
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		getAnns: function(club_eng) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/" + club_eng + "/announcements",
				data: {openid: $rootScope.openid},
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		getAnn: function(id) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/announcementinfo",
				data: {openid: $rootScope.openid, id: id},
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		register: function() {
			var deferred = $q.defer();
			$.post("/clubs/" + $rootScope.club.club_eng + "/ngapply?t=" + new Date().getTime(), $("#regForm").serialize() + "&openid=" + $rootScope.openid, function(data) {
				deferred.resolve(data);
			});
			return deferred.promise;
		},
		search: function(name, offset, limit) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/findclub1",
				data: {openid: $rootScope.openid, name: name, offset: offset, limit: limit},
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		getBaseMileages: function(club_eng, mileage_type) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/" + club_eng + "/basemileages",
				data: {club_eng: club_eng, type: mileage_type ? mileage_type : 'run'},
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
		getChartData:function(type, mileage_type) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/" + $rootScope.club.club_eng + "/chartdata",
				data: {clubid: $rootScope.club.clubid, type: type, mileage_type: mileage_type ? mileage_type : 'run'},
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		},
				getRank: function(type, offset, limit, view, mileage_type) {
					var deferred = $q.defer();
					$.ajax({
						url: "/clubs/" + $rootScope.club.club_eng + "/getranklist",
						data: {type: type, offset: offset, limit: limit, mileage_type: mileage_type, view: view ? view : ''},
						success: function(data) {
							deferred.resolve(data);
						}
					});
					return deferred.promise;
				},
		getRecentMileages: function(offset, limit, type) {
			var deferred = $q.defer();
			$.ajax({
				url: "/clubs/" + $rootScope.club.club_eng + "/recentmileages",
				data: {offset: offset, limit: limit, clubid: $rootScope.club.clubid, mileage_type: type ? type : 'run'},
				success: function(data) {
					deferred.resolve(data);
				}
			});
			return deferred.promise;
		}
	}
	return service;
});

clubApp.controller('annController', function($scope, $routeParams, ClubService, WxService, $rootScope, UtilService, ann, $sce) {
	if (ann) {
		$rootScope.club = ann.club;
		ann.content = $sce.trustAsHtml(ann.content);
		$scope.ann = ann;
		WxService.shareObj.title = $rootScope.club.club_name;
		WxService.shareObj.desc = ann.subject;
		WxService.shareObj.link = location.href;
		WxService.shareObj.imgUrl = "http://xiaoi.b0.upaiyun.com/" + ann.coverurl + $rootScope.WX_COVER;
	}
});

clubApp.controller('ClubRecentMileagesContorller', function($scope, $routeParams, ClubService, WxService, $rootScope, UtilService, club) {
	$rootScope.club = club;
	$scope.offset = 0;
	$scope.limit = Math.ceil($(window).height() / 80);
	$scope.latest = 0;
	$scope.loadMore = function() {
		if ($scope.latest == 0 || $scope.latest != $scope.offset) {
			$("#loadingEl").show();
			$scope.latest = $scope.offset;
			ClubService.getRecentMileages($scope.offset, $scope.limit).then(function(data) {
				$scope.offset += data.length;
				if (!$scope.recents) {
					$scope.recents = [];
				}
				$.each(data, function(i, n) {
					n.delay = i + 1;
					$scope.recents.push(n);
				});
				$("#loadingEl").hide();
			});
		}
	};
	WxService.shareObj.title = $rootScope.club.club_name + "|最近打卡";
	WxService.shareObj.desc = $rootScope.club.club_slogan + "\n这是一个值得加入的跑团";
	WxService.shareObj.link = location.href;
	if ($rootScope.club.club_logo) {
		WxService.shareObj.imgUrl = "http://xiaoi.b0.upaiyun.com/" + $rootScope.club.club_logo + "!mid";
	} else {
		WxService.shareObj.imgUrl = "http://" + document.domain + "/image/club_default.png";
	}
});

clubApp.controller('ClubRankContorller', function($scope, $routeParams, ClubService, WxService, $rootScope, UtilService, club) {
	$rootScope.club = club;
	$scope.offset = 0;
	$scope.limit = Math.ceil($(window).height() / 55);
	$scope.latest = 0;
	$scope.loadMore = function() {
		$("#wu_rank").hide();
		var type = ClubService.type;
		if ($scope.type && $scope.type != type) {
			$scope.ranks = [];
			$scope.offset = 0;
			$scope.latest = 0;
		}
		if ($scope.type) {
			ClubService.type = $scope.type;
		}
		if ($scope.latest == 0 || $scope.latest != $scope.offset) {
			$("#loadingEl").show();
			$scope.latest = $scope.offset;
			$scope.active = ClubService.type;
			ClubService.getRank(ClubService.type, $scope.offset, $scope.limit).then(function(data) {
				$scope.offset += data.length;
				if (!$scope.ranks) {
					$scope.ranks = [];
				}
				$.each(data, function(i, n) {
					$scope.ranks.push(n);
				});
				if ($scope.ranks.length == 0) {
					$("#wu_rank").show();
				}
				$("#loadingEl").hide();
			});
		}
	}
	$scope.getRankData = function(type) {
		$scope.type = type;
		$scope.loadMore();
	}
	WxService.shareObj.title = $rootScope.club.club_name + "|跑量英雄榜";
	WxService.shareObj.desc = $rootScope.club.club_slogan + "\n这是一个值得加入的跑团";
	WxService.shareObj.link = location.href;
	if ($rootScope.club.club_logo) {
		WxService.shareObj.imgUrl = "http://xiaoi.b0.upaiyun.com/" + $rootScope.club.club_logo + "!mid";
	} else {
		WxService.shareObj.imgUrl = "http://" + document.domain + "/image/club_default.png";
	}
});

clubApp.controller('ClubMileagesContorller', function($scope, $routeParams, ClubService, WxService, $rootScope, UtilService, club, ChartService) {
	$rootScope.club = club;
	$scope.mileage_type = $rootScope.mileage_type;
	$scope.getChartData = function(type) {
		$scope.type = type;
		$scope.chart.showLoading();
		ClubService.getChartData(type, $scope.mileage_type).then(
				function(data) {
					var current = $("#" + type);
					$.each(current.parent().children(), function(i, n) {
						if (current.attr("id") != n.id) {
							$(n).removeClass("active");
						}
					});
					current.addClass("active");
					ChartService.mileageChartOption.xAxis[0].data = $.parseJSON(data.xAxis);
					ChartService.mileageChartOption.series[0].data = $.parseJSON(data.series);
					$scope.chart.clear();
					$scope.chart.setOption(ChartService.mileageChartOption);
					$scope.chart.hideLoading();
				});
	}
	UtilService.loadChartScript(function() {
		require(['echarts', 'echarts/chart/bar', // 使用柱状图就加载bar模块，按需加载
			'echarts/chart/line' // 使用柱状图就加载bar模块，按需加载
		], function(ec) {
			// 基于准备好的dom，初始化echarts图表
			$scope.chart = ec.init(document.getElementById('mileage_chart'));
			// 为echarts对象加载数据
			$scope.chart.setOption(ChartService.mileageChartOption);
			$scope.getChartData("seven");
			window.onresize = $scope.chart.resize;
		});
	});

	$scope.view_type = 'sub';
	$scope.switchRankView = function(type, $event) {
		$scope.view_type = type;
		$event.target.style.color = 'graytext';
		$($event.target).siblings('a').css('color', '#0099da');
		$scope.getRankData($scope.rank_type);
	};
	$scope.getRankData = function(type) {
		$("#loading_rank").show();
		if ($("#loading_rank").height()) {
			$("#loading_rank").css("padding-top", $("#loading_rank").height() / 2 - 14 + "px");
		}
		$scope.rank_type = type;
		ClubService.type = type;
		$("#zw-rank").hide();
		ClubService.getRank(type, 0, 5, $scope.view_type, $scope.mileage_type).then(
				function(data) {
					$("#loading_rank").hide();
					var current = $("#rank_" + type);
					$.each(current.parent().children(), function(i, n) {
						if (current.attr("id") != n.id) {
							$(n).removeClass("active");
						}
					});
					current.addClass("active");
					$scope.rankList = data;
					if ($scope.rankList.length == 0) {
						$("#zw-rank").show();
					}
				});
	}

	$scope.getRankData('seven');
	$scope.more_recent = false;
	ClubService.getRecentMileages(0, 9, $scope.mileage_type).then(function(data) {
		$("#loading_recent").hide();
		$scope.recents = data;
		if ($scope.recents.length == 9) {
			$scope.more_recent = true;
		}
	});
	WxService.shareObj.title = $rootScope.club.club_name;
	WxService.shareObj.desc = $rootScope.club.club_slogan + "\n这是一个值得加入的跑团";
	WxService.shareObj.link = location.href;
	if ($rootScope.club.club_logo) {
		WxService.shareObj.imgUrl = "http://xiaoi.b0.upaiyun.com/" + $rootScope.club.club_logo + "!mid";
	} else {
		WxService.shareObj.imgUrl = "http://" + document.domain + "/image/club_default.png";
	}
});

clubApp.controller('clubRegisterController', function($scope, $routeParams, ClubService, WxService, $rootScope, UtilService, club, member) {
	$rootScope.club = club;
	$scope.subs = club.sub;
	$scope.config = member.configs;
	$scope.member = member.member;
	$scope.payment = member.pay;
	$scope.config_length = $scope.config.length;
	if ($scope.member.id) {
		$scope.modified = false;
	} else {
		if (!$rootScope.club_agree && $rootScope.club.is_show_chapter && $.trim($rootScope.club.club_charter) != "") {
			$rootScope.club_agree = false;
			location.replace("http://" + document.domain + "/wechat/#/clubs/regulations?club_eng=" + $rootScope.club.club_eng);
			return;
		}
		$scope.modified = true;
	}
	$scope.newPay = member.newPay;
	$scope.regSubmit = function(valid) {
		if ($("#regForm").valid() == false) {
			//$(".has-error").children("input[type!='hidden']")[0].focus();
			var firstError = $(".has-error")[0];
			var top = $(firstError).children("input[type!='hidden']").offset().top;
			UtilService.scrollTo(top);
		} else {
			$("#btnApply").button("loading");
			ClubService.register().then(function(data) {
				if (data.status == 0) {
					UtilService.showMessage(data.msg, null, null);
				} else {
					if (data.result == "success") {
						if ($scope.member.id) {
							UtilService.showMessage("信息已修改!", null, null);
						} else {
							UtilService.showMessage("恭喜您！成功加入" + $rootScope.club.club_name, null, function() {
								location.href = "/wechat/#/clubs/members?club_eng=" + $rootScope.club.club_eng;
							});
						}
					}
					$scope.config = data.data.configs;
					$scope.member = data.data.member;
					$scope.payment = data.data.pay;
					$scope.modified = false;
					if (data.result == "needpay") {
						UtilService.showMessage("需要支付会费才能成为正式会员，是否现在支付?", null, function() {
							$scope.pay();
						});
					}
					if (data.result == "needconfirm") {
						UtilService.showMessage("您的入会请求已提交，请等待审核!", null, null);
					}
				}
				UtilService.scrollTo(0);
			});
		}
	};

	$scope.pay = function() {
		$("#hash").val(window.location.hash.substring(1));
		$("#payForm").submit();
	};

	$scope.showModify = function() {
		$scope.modified = true;
	};

	$scope.getResCode = function() {
		$("#regError").text("");
		var phone = $.trim($("#cell").val());
		if (phone == "") {
			$("#cell").focus();
			return;
		}
		UtilService.disableBtn("#veriCode", $("#veriCode").text());
		UtilService.getRegCode(phone).then(function(data) {
			if (data.status == 0) {
				UtilService.showMessage(data.msg, null, null);
			}
		});
	}

	$scope.$on('ngRenderFinished', function(ngRenderFinishedEvent, data) {
		if (member.configs.length == 0 && !$scope.member.id) {
			$scope.regSubmit();
		}
	});

	$scope.$on('ngRepeatRenderFinished', function(ngRenderFinishedEvent, data) {
		$.each($("option[isSelected]"), function(i, n) {
			if ($(n).attr("isSelected") + "" == 1) {
				$(n).attr("selected", "selected");
			}
		});
	});

	$scope.$on('ngFormRepeatRenderFinished', function(ngFormRepeatRenderFinishedEvent, data) {
		$.each($("input"), function(i, n) {
			if ($(n).attr("type") == "file") {
				//fileuploadNg(n.id,true);
			}
			if ($(n).attr("isRequired") == "1" || $(n).attr("isRequired") == "true") {
				$(n).attr("required", true);
				$(n).attr("check-type", $(n).attr("check-type") + " required");
			}
		});
		$.each($("select"), function(i, n) {
			var sel = $(n);
			var id = $(n).attr("id");
			$.each($scope.config, function(x, y) {
				if (y.col_name == id) {
					$.each(y.col_list_values, function(m, v) {
						if (v != null && $.trim(v) != "") {
							if (v.selected == 1) {
								sel.append('<option  value="' + v.value + '" selected="selected">' + v.text + '</option>');
							} else {
								sel.append('<option  value="' + v.value + '">' + v.text + '</option>');
							}
						}
					});
				}
			});
			if ($(n).attr("isSelected") == 1) {
				$(n).attr("selected", "selected");
			}
		});

		$.each($("input[date-type]"), function(i, n) {
			if ($(this).attr("date-max") == "now") {
				$(this).attr("max", new Date());
			}
			initDateTimePicker(null, "#" + this.id, $(this).attr("date-type"));
		});
		checkCell();
	});

});

clubApp.controller('clubController', function($scope, $routeParams, ClubService, WxService, club, $rootScope, LoginService, UtilService, ActService, $sce) {
	if ($routeParams.club_eng) {
		$scope.member = club.member;
		$scope.showwalk = club.showwalk;
		$rootScope.canNew = false;
		$rootScope.club_eng = $routeParams.club_eng;
		$rootScope.club_id = club.club.clubid;
		$rootScope.club = club.club;
		WxService.shareObj.title = $rootScope.club.club_name;
		WxService.shareObj.desc = $rootScope.club.club_slogan + "\n这是一个值得加入的跑团";
		WxService.shareObj.link = location.href;
		if ($rootScope.club.club_logo) {
			WxService.shareObj.imgUrl = "http://xiaoi.b0.upaiyun.com/" + $rootScope.club.club_logo + "!mid";
		} else {
			WxService.shareObj.imgUrl = "http://" + document.domain + "/image/club_default.png";
		}
		store.remove("member_start_time");
		store.remove("member_start_time_ids");
		store.remove("act_start_time");
		store.remove("act_start_time_ids");
		store.remove("club_eng");
		$scope.anns = club.anns;
		$scope.anns.count = $scope.anns.length;
		$scope.member_start_time_ids = [];
		$scope.members = club.members;
		$scope.newMembersCount = $scope.members.length;
		$scope.acts = club.acts;
		$scope.newActCount = $scope.acts.length;
		$scope.total = club.total;
	}

	$scope.$on('ngRepeatRenderFinished', function(ngRenderFinishedEvent, data) {
		$('#carousel-announce').carousel();
	});
	$scope.getChartData = function(club_eng, type, element) {
		ClubService.getChartData(club_eng, type);
	};

	$scope.allMembers = function() {
		$scope.member_start_time_ids = [];
		$.each($scope.members, function(i, n) {
			$scope.member_start_time_ids.push(n.id);
		});
		if ($scope.members && $scope.members.length > 0) {
			UtilService.setLocalClubMemberDate($scope.members[0].create_time, $rootScope.club.club_eng);
			UtilService.setLocalClubMemberIds($scope.member_start_time_ids, $rootScope.club.club_eng);
		}
		//location.href="http://"+document.domain+"/clubs/"+$rootScope.club.club_eng+"/members";
		location.href = "http://" + document.domain + "/wechat/#/clubs/members?club_eng=" + $rootScope.club_eng;
	}

	$scope.actList = function() {
		if ($scope.acts && $scope.acts.length > 0) {
			UtilService.setLocalActivityIds($scope.act_start_time_ids, $rootScope.club.club_eng);
			UtilService.setLocalActivityDate($scope.acts[0].act_create_time, $rootScope.club.club_eng);
		}
		location.href = "http://" + document.domain + "/wechat/#/activity/list?club_eng=" + $rootScope.club_eng;

		//获取用户信息，跳转页面至登录页面
		// var userInfo = store.get('userInfo');
		// location.href = "http://wechat.paobuqu.com/mobile/#/index/activity?club_eng=" + $rootScope.club_eng
		// + '&uid=' + userInfo.uid + '&type=act';
		
	};

	$scope.newAct = function() {
		ActService.canNew($rootScope.club.club_eng, true, function(data) {
			hideLoading();
			console.log(data)
		});
	};
});

clubApp.controller('clubMembersController', function($scope, $routeParams, ClubService, WxService, club, $rootScope, UtilService) {
	if (club) {
		$scope.member = club.member;
		$rootScope.club = club.club;
		$rootScope.club.owner = club.owner;
		$rootScope.club.total = club.total;
		$scope.offset = 0;
		$limit = Math.ceil($(window).height() / 77 * 5);
		$scope.limit = $limit;
	}
	$scope.members = [];
	$scope.loadMore = function() {
		$("#loadingEl").show();
		ClubService.getMembers($rootScope.club.club_eng, $scope.offset, $scope.limit).then(function(data) {
			$("#loadingEl").hide();
			$scope.offset += $scope.limit;
			$.each(data.members, function(i, n) {
				n.delay = i + 1;
				$scope.members.push(n);
			});
		});
	};
});

clubApp.controller('clubIntroController', function($scope, $routeParams, ClubService, WxService, club, $rootScope) {
	if (club) {
		$rootScope.club = club;
		$("#club_desc").html($rootScope.club.club_desc);
	}
});

clubApp.controller('clubRegulationsController', function($scope, $routeParams, ClubService, WxService, club, $rootScope) {
	if (club) {
		$rootScope.club = club;
		$("#club_regulations").html($rootScope.club.club_charter);
	}
	$scope.back = function() {
		$rootScope.club_agree = false;
		location.href = "/wechat/#/clubs/home?club_eng=" + $rootScope.club.club_eng;
	}
	$scope.agree = function() {
		$rootScope.club_agree = true;
		location.href = "http://" + document.domain + "/wechat/#/clubs/register?club_eng=" + $rootScope.club.club_eng;
	}
});


clubApp.controller('SearchClubsContorller', function($scope, $routeParams, WxService, ClubService, $rootScope) {
	$scope.me = false;
	if (ClubService.searchKey != null) {
		$scope.searchKey = ClubService.searchKey;
		ClubService.searchKey = null;
	}
	$scope.clubs = [];
	$scope.offset = 0;
	$scope.limit = Math.ceil($(window).height() / 80);
	$scope.latest = 0;
	$scope.searchClubs = function(click) {
		var name = $.trim($("#searchText").val());
		if (name != "") {
			if (click) {
				$scope.latest = 0;
				$scope.offset = 0;
				$scope.clubs = new Array();
			}
			$scope.searchKey = name;
			if ($scope.latest == 0 || $scope.latest != $scope.offset) {
				$("#loadingEl").show();
				$scope.latest = $scope.offset;
				ClubService.search(name, $scope.offset, $scope.limit).then(function(data) {
					$scope.offset += data.length;
					$.each(data, function(i, n) {
						var has = false;
						$.each($scope.clubs, function(x, y) {
							if (y.clubid == n.clubid) {
								has = true;
								return false;
							}
						});
						if (!has) {
							n.delay = i + 1;
							$scope.clubs.push(n);
						}
					});
					$scope.clubs_length = $scope.clubs.length;
					$scope.search = true;
					$("#loadingEl").hide();
				});
			}
		}
	}
});






