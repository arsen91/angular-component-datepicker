/*global angular document*/
(function withAngular(angular) {
    'use strict';

    var A_DAY_IN_MILLISECONDS = 86400000, 
        generateMonthAndYearHeader = function generateMonthAndYearHeader(prevButton, nextButton) {
            return [
                '<div class="datepicker-calendar-header">',
                  '<div class="datepicker-calendar-header-left">',
                    '<a class="datepicker-calendar-month-button" href="javascript:void(0)" ng-class="{\'datepicker-item-hidden\': !$ctrl.willPrevMonthBeSelectable()}" ng-click="$ctrl.prevMonth()">',
                      prevButton,
                    '</a>',
                  '</div>',
                  '<div class="datepicker-calendar-header-middle datepicker-calendar-month">',
                    '{{$ctrl.month}}&nbsp;',
                      '<span>',
                        '{{$ctrl.year}}',
                      '</span>',
                  '</div>',
                  '<div class="datepicker-calendar-header-right">',
                  '<a class="datepicker-calendar-month-button" ng-class="{\'datepicker-item-hidden\': !$ctrl.willNextMonthBeSelectable()}" href="javascript:void(0)" ng-click="$ctrl.nextMonth()">',
                    nextButton,
                  '</a>',
                  '</div>',
                '</div>'
            ];
        },

        generateDaysColumns = function generateDaysColumns() {
            return [
                '<div class="datepicker-calendar-days-header">',
                    '<div ng-repeat="d in $ctrl.daysInString">',
                    '{{d}}',
                    '</div>',
                '</div>'
            ];
        }, 

        generateDays = function generateDays() {
            return [
                '<div class="datepicker-calendar-body">',
                    '<a href="javascript:void(0)" ng-repeat="px in $ctrl.prevMonthDays" class="datepicker-calendar-day datepicker-disabled">',
                        '{{px}}',
                    '</a>',
                    '<a href="javascript:void(0)" ng-repeat="item in $ctrl.days" ng-click="$ctrl.setDatepickerDay(item)" ng-class="{\'datepicker-active\': $ctrl.selectedDay === item && $ctrl.selectedMonth === $ctrl.monthNumber && $ctrl.selectedYear === $ctrl.year, \'datepicker-disabled\': !$ctrl.isSelectableMinDate($ctrl.year + \'/\' + $ctrl.monthNumber + \'/\' + item ) || !$ctrl.isSelectableMaxDate($ctrl.year + \'/\' + $ctrl.monthNumber + \'/\' + item)}" class="datepicker-calendar-day">',
                        '{{item}}',
                    '</a>',
                    '<a href="javascript:void(0)" ng-repeat="nx in $ctrl.nextMonthDays" class="datepicker-calendar-day datepicker-disabled">',
                        '{{nx}}',
                    '</a>',
                '</div>'
            ];
        },

        generateHtmlTemplate = function generateHtmlTemplate(prevButton, nextButton) {

            var toReturn = [
                '<div class="datepicker-calendar {{$ctrl.datepickerID}}" class="datepicker-forced-to-open" ng-blur="$ctrl.hideCalendar()">',
                '</div>'
            ], 
            monthAndYearHeader = generateMonthAndYearHeader(prevButton, nextButton), 
            daysColumns = generateDaysColumns(), 
            days = generateDays(), 
            iterator = function iterator(aRow) {
                toReturn.splice(toReturn.length - 1, 0, aRow);
            };

            monthAndYearHeader.forEach(iterator);
            daysColumns.forEach(iterator);
            days.forEach(iterator);

            return toReturn.join('');
        };

    angular.module('datepicker', [])
       .directive('datepickerComponent', function DatepickerConstr() {
            return {
                restrict: 'A',
                scope: {
                    dateModel: '='
                },
                bindToController: true,
                controllerAs: '$ctrl',
                controller: ControllerFunction
                // template: '<input ng-model="$ctrl.dateModel" type="text" class="angular-datepicker-input"/>'
            };
        });

    function ControllerFunction($scope, $element, $locale, $interpolate, $filter, $compile, $window) {
        var selector = 'angular-datepicker-input',
        vm = this,
        thisInput = $element,
        theCalendar,
        prevButton = '<b class="datepicker-default-button">&lang;</b>',
        nextButton = '<b class="datepicker-default-button">&rang;</b>',
        dateWeekStartDay = '1',
        date = new Date(), 
        dateString,
        isMouseOn = false,
        isMouseOnInput = false,
        datetime = $locale.DATETIME_FORMATS,
        pageDatepickers,
        hours24h = 86400000,
        htmlTemplate = generateHtmlTemplate(prevButton, nextButton),
        n,

        onClickOnWindow = function onClickOnWindow() {
            if (!isMouseOn && !isMouseOnInput && theCalendar) {
                vm.hideCalendar();
            }
        },

        setDaysInMonth = function setDaysInMonth(month, year) {
            var i,
            limitDate = new Date(year, month, 0).getDate(),
            firstDayMonthNumber = new Date(year + '/' + month + '/' + 1).getDay(),
            lastDayMonthNumber = new Date(year + '/' + month + '/' + limitDate).getDay(),
            prevMonthDays = [],
            nextMonthDays = [],
            howManyNextDays, 
            howManyPreviousDays, 
            monthAlias, 
            dateWeekEndDay;

            vm.days = [];
            vm.dateWeekStartDay = vm.validateWeekDay(dateWeekStartDay);
            dateWeekEndDay = (vm.dateWeekStartDay + 6) % 7;

            for (i = 1; i <= limitDate; i += 1) {
                vm.days.push(i);
            }

            if (firstDayMonthNumber === vm.dateWeekStartDay) {
                vm.prevMonthDays = [];
            } else {
                howManyPreviousDays = firstDayMonthNumber - vm.dateWeekStartDay;

                if (firstDayMonthNumber < vm.dateWeekStartDay) {
                    howManyPreviousDays += 7;
                }

                if (Number(month) === 1) {
                    monthAlias = 12;
                } else {
                    monthAlias = month - 1;
                }

                for (i = 1; i <= new Date(year, monthAlias, 0).getDate(); i += 1) {
                    prevMonthDays.push(i);
                }
                vm.prevMonthDays = prevMonthDays.slice(-howManyPreviousDays);
            }

            if (lastDayMonthNumber === dateWeekEndDay) {
                vm.nextMonthDays = [];
            } else {
                howManyNextDays = 6 - lastDayMonthNumber + vm.dateWeekStartDay;

                if (lastDayMonthNumber < vm.dateWeekStartDay) {
                    howManyNextDays -= 7;
                }

                for (i = 1; i <= howManyNextDays; i += 1) {
                    nextMonthDays.push(i);
                }

                vm.nextMonthDays = nextMonthDays;
            }
        }, 

        resetToMinDate = function resetToMinDate() {
            vm.month = $filter('date')(new Date(vm.dateMinLimit), 'MMMM');
            vm.monthNumber = Number($filter('date')(new Date(vm.dateMinLimit), 'MM'));
            vm.day = Number($filter('date')(new Date(vm.dateMinLimit), 'dd'));
            vm.year = Number($filter('date')(new Date(vm.dateMinLimit), 'yyyy'));

            setDaysInMonth(vm.monthNumber, vm.year);
        }, 

        resetToMaxDate = function resetToMaxDate() {
            vm.month = $filter('date')(new Date(vm.dateMaxLimit), 'MMMM');
            vm.monthNumber = Number($filter('date')(new Date(vm.dateMaxLimit), 'MM'));
            vm.day = Number($filter('date')(new Date(vm.dateMaxLimit), 'dd'));
            vm.year = Number($filter('date')(new Date(vm.dateMaxLimit), 'yyyy'));

            setDaysInMonth(vm.monthNumber, vm.year);
        }, 

        prevYear = function prevYear() {
            vm.year = Number(vm.year) - 1;
        }, 

        nextYear = function nextYear() {
            vm.year = Number(vm.year) + 1;
        }, 

        setInputValue = function setInputValue() {
            if (vm.isSelectableMinDate(vm.year + '/' + vm.monthNumber + '/' + vm.day) &&
                vm.isSelectableMaxDate(vm.year + '/' + vm.monthNumber + '/' + vm.day)) {

                var modelDate = new Date(vm.year + '/' + vm.monthNumber + '/' + vm.day);

                thisInput.val(modelDate);

                thisInput.triggerHandler('input');
                thisInput.triggerHandler('change');//just to be sure;
            } else {
                return false;
            }
        },                
        
        classHelper = {
            'add': function add(ele, klass) {
                var classes;

                if (ele.className.indexOf(klass) > -1) {
                    return;
                }

                classes = ele.className.split(' ');
                classes.push(klass);
                ele.className = classes.join(' ');
            },
            'remove': function remove(ele, klass) {
                var i, classes;

                if (ele.className.indexOf(klass) === -1) {
                    return;
                }

                classes = ele.className.split(' ');

                for (i = 0; i < classes.length; i += 1) {
                    if (classes[i] === klass) {

                        classes = classes.slice(0, i).concat(classes.slice(i + 1));
                        break;
                    }
                }

                ele.className = classes.join(' ');
            }
        },

        showCalendar = function showCalendar() {
            //lets hide all the latest instances of datepicker
            pageDatepickers = $window.document.getElementsByClassName('datepicker-calendar');

            angular.forEach(pageDatepickers, function forEachDatepickerPages(value, key) {
                if (pageDatepickers[key].classList) {
                    pageDatepickers[key].classList.remove('datepicker-open');
                } else {
                    classHelper.remove(pageDatepickers[key], 'datepicker-open');
                }
            });

            if (theCalendar.classList) {
                theCalendar.classList.add('datepicker-open');
                dateString = angular.element(angular.element(theCalendar).parent()[0].querySelector('input')).val().replace(/\//g, '-');
                date = new Date(dateString);
                vm.selectedMonth = Number($filter('date')(date, 'MM'));
                vm.selectedDay = Number($filter('date')(date, 'dd'));
                vm.selectedYear = Number($filter('date')(date, 'yyyy'));
            } else {
                classHelper.add(theCalendar, 'datepicker-open');
            }

            $scope.$digest();
        },

        unregisterDataSetWatcher = $scope.$watch('$ctrl.dateSet', function dateSetWatcher(newValue) {
            if (newValue && !isNaN(Date.parse(newValue))) {
                date = new Date(newValue);

                vm.month = $filter('date')(date, 'MMMM');//december-November like
                vm.monthNumber = Number($filter('date')(date, 'MM')); // 01-12 like
                vm.day = Number($filter('date')(date, 'dd')); //01-31 like
                vm.year = Number($filter('date')(date, 'yyyy'));//2014 like

                setDaysInMonth(vm.monthNumber, vm.year);
                setInputValue();
            }
        }),
        
        unregisterDateMinLimitWatcher = $scope.$watch('$ctrl.dateMinLimit', function dateMinLimitWatcher(newValue) {
            if (newValue) {
                resetToMinDate();
            }
        }),

        unregisterDateMaxLimitWatcher = $scope.$watch('$ctrl.dateMaxLimit', function dateMaxLimitWatcher(newValue) {
            if (newValue) {
                resetToMaxDate();
            }
        });

        vm.nextMonth = function nextMonth() {
            if (vm.monthNumber === 12) {
                vm.monthNumber = 1;
                //its happy new year
                nextYear();
            } else {
                vm.monthNumber += 1;
            }

            //check if max date is ok
            if (vm.dateMaxLimit) {

                if (!vm.isSelectableMaxDate(vm.year + '/' + vm.monthNumber + '/' + vm.days[0])) {
                    resetToMaxDate();
                }
            }

            //set next month
            vm.month = $filter('date')(new Date(vm.year, vm.monthNumber - 1), 'MMMM');
            //reinit days
            setDaysInMonth(vm.monthNumber, vm.year);
            //deactivate selected day
            vm.day = undefined;
        };

        vm.willPrevMonthBeSelectable = function willPrevMonthBeSelectable() {
            var monthNumber = vm.monthNumber, 
            year = vm.year,
            prevDay = $filter('date')(new Date(new Date(year + '/' + monthNumber + '/01').getTime() - hours24h), 'dd'); //get last day in previous month

            if (monthNumber === 1) {
                monthNumber = 12;
                year = year - 1;
            } else {
                monthNumber -= 1;
            }

            if (vm.dateMinLimit) {
                if (!vm.isSelectableMinDate(year + '/' + monthNumber + '/' + prevDay)) {
                    return false;
                }
            }
            return true;
        };

        vm.willNextMonthBeSelectable = function willNextMonthBeSelectable() {
            var monthNumber = vm.monthNumber, 
            year = vm.year;

            if (monthNumber === 12) {
                monthNumber = 1;
                year += 1;
            } else {
                monthNumber += 1;
            }

            if (vm.dateMaxLimit) {
                if (!vm.isSelectableMaxDate(year + '/' + monthNumber + '/01')) {
                    return false;
                }
            }

            return true;
        };

        vm.prevMonth = function managePrevMonth() {
            if (vm.monthNumber === 1) {
                vm.monthNumber = 12;
                //its happy new year
                prevYear();
            } else {
                vm.monthNumber -= 1;
            }

            //check if min date is ok
            if (vm.dateMinLimit) {
                if (!vm.isSelectableMinDate(vm.year + '/' + vm.monthNumber + '/' + vm.days[vm.days.length - 1])) {
                    resetToMinDate();
                }
            }
            //set next month
            vm.month = $filter('date')(new Date(vm.year, vm.monthNumber - 1), 'MMMM');
            //reinit days
            setDaysInMonth(vm.monthNumber, vm.year);
            //deactivate selected day
            vm.day = undefined;
        };  

        vm.selectedMonthHandle = function manageSelectedMonthHandle(selectedMonthNumber) {
            vm.monthNumber = Number($filter('date')(new Date(selectedMonthNumber + '/01/2000'), 'MM'));
            setDaysInMonth(vm.monthNumber, vm.year);
            setInputValue();
        };

        vm.hideCalendar = function hideCalendar() {
            if (theCalendar.classList) {
                theCalendar.classList.remove('datepicker-open');
            } else {
                classHelper.remove(theCalendar, 'datepicker-open');
            }
        };

        vm.setDatepickerDay = function setDatepickerDay(day) {
            vm.day = Number(day);
            vm.selectedDay = vm.day;
            vm.selectedMonth = vm.monthNumber;
            vm.selectedYear = vm.year;

            setInputValue();
            vm.hideCalendar();
            
        };

        vm.paginateYears = function paginateYears(startingYear) {
            var i, 
            theNewYears = [], 
            daysToPrepend = 10, 
            daysToAppend = 10;

            vm.paginationYears = []; 

            for (i = daysToPrepend; i > 0; i -= 1) {
                theNewYears.push(Number(startingYear) - i);
            }

            for (i = 0; i < daysToAppend; i += 1) {
                theNewYears.push(Number(startingYear) + i);
            }
            
            vm.paginationYears = theNewYears;
        };

        vm.isSelectableMinDate = function isSelectableMinDate(aDate) {
            //if current date
            return !(!!vm.dateMinLimit && !!new Date(vm.dateMinLimit) && new Date(aDate).getTime() < new Date(vm.dateMinLimit).getTime());
        };

        vm.isSelectableMaxDate = function isSelectableMaxDate(aDate) {
            //if current date
            return !(!!vm.dateMaxLimit && !!new Date(vm.dateMaxLimit) && new Date(aDate).getTime() > new Date(vm.dateMaxLimit).getTime());
        };

        vm.isSelectableMaxYear = function isSelectableMaxYear(year) {
            return !(!!vm.dateMaxLimit && year > new Date(vm.dateMaxLimit).getFullYear());
        };

        vm.isSelectableMinYear = function isSelectableMinYear(year) {
            return !(!!vm.dateMinLimit && year < new Date(vm.dateMinLimit).getFullYear());
        };

        vm.validateWeekDay = function isValidWeekDay(weekDay) {
            var validWeekDay = Number(weekDay, 10);
            // making sure that the given option is valid
            if (!validWeekDay || validWeekDay < 0 || validWeekDay > 6) {
                validWeekDay = 0;
            }
            return validWeekDay;
        };

        // respect previously configured interpolation symbols.
        htmlTemplate = htmlTemplate.replace(/{{/g, $interpolate.startSymbol()).replace(/}}/g, $interpolate.endSymbol());
        vm.month = $filter('date')(date, 'MMMM');//december-November like
        vm.monthNumber = Number($filter('date')(date, 'MM')); // 01-12 like
        vm.day = Number($filter('date')(date, 'dd')); //01-31 like
        vm.dateWeekStartDay = vm.validateWeekDay(dateWeekStartDay);

        if (vm.dateMaxLimit) {
            vm.year = Number($filter('date')(new Date(vm.dateMaxLimit), 'yyyy'));//2014 like
        } else {
            vm.year = Number($filter('date')(date, 'yyyy'));//2014 like
        }
        vm.months = datetime.MONTH;

        vm.daysInString = [];
        for (n = vm.dateWeekStartDay; n <= vm.dateWeekStartDay + 6; n += 1) {
            vm.daysInString.push(n % 7);
        }
        vm.daysInString = vm.daysInString.map(function mappingFunc(el) {
            return $filter('date')(new Date(new Date('06/08/2014').valueOf() + A_DAY_IN_MILLISECONDS * el), 'EEE');
        });

        thisInput.after($compile(angular.element(htmlTemplate))($scope));
        //get the calendar as element
        theCalendar = $window.document.querySelector('.datepicker-calendar');
        
        thisInput.on('focus click focusin', function onFocusAndClick() {
            isMouseOnInput = true;

            if (!isMouseOn && !isMouseOnInput && theCalendar) {
                vm.hideCalendar();
            } else {
                showCalendar();
            }
        });

        thisInput.on('focusout blur', function onBlurAndFocusOut() {
            isMouseOnInput = false;
        });
        //some tricky dirty events to fire if click is outside of the calendar and show/hide calendar when needed
        angular.element(theCalendar).on('mouseenter', function onMouseEnter() {
            isMouseOn = true;
        });

        angular.element(theCalendar).on('mouseleave', function onMouseLeave() {
            isMouseOn = false;
        });

        angular.element(theCalendar).on('focusin', function onCalendarFocus() {
            isMouseOn = true;
        });

        angular.element($window).on('click focus focusin', onClickOnWindow);

        //check always if given range of dates is ok
        if (vm.dateMinLimit && !vm.isSelectableMinYear(vm.year) || !vm.isSelectableMinDate(vm.year + '/' + vm.monthNumber + '/' + vm.day)) {
            resetToMinDate();
        }

        if (vm.dateMaxLimit && !vm.isSelectableMaxYear(vm.year) || !vm.isSelectableMaxDate(vm.year + '/' + vm.monthNumber + '/' + vm.day)) {
            resetToMaxDate();
        }

        //datepicker boot start
        vm.paginateYears(vm.year);

        setDaysInMonth(vm.monthNumber, vm.year);

        $scope.$on('$destroy', function unregisterListener() {
            unregisterDataSetWatcher();
            unregisterDateMinLimitWatcher();
            unregisterDateMaxLimitWatcher();
            thisInput.off('focus click focusout blur');
            angular.element(theCalendar).off('mouseenter mouseleave focusin');
            angular.element($window).off('click focus focusin', onClickOnWindow);
        });
    }
}(angular));
