angular.module('datepicker')
       .controller('SomeCtrl', function SomeCtrl($scope, $filter) {
            var vm = this;
            
            this.someDate = $filter('date')(new Date(), 'yyyy-MM-dd');

            $scope.$watch(
                function() {
                    return vm.someDate;
                },
                function() { 
                    console.log(vm.someDate);
                });
       });