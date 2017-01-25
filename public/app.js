angular.module('datepicker')
       .controller('SomeCtrl', function SomeCtrl($scope) {
            var vm = this;
            
            this.someDate = (new Date()).toString();

            $scope.$watch(
                function() {
                    return vm.someDate;
                },
                function() { 
                    console.log(vm.someDate);
                });
       });