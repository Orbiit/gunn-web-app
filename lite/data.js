const normalSchedules = [
  null,
  [
    {name: "Period A", start: 505, end: 585},
    {name: "Brunch", start: 585, end: 600},
    {name: "Period B", start: 600, end: 675},
    {name: "Period C", start: 685, end: 760},
    {name: "Lunch", start: 760, end: 800},
    {name: "Period F", start: 800, end: 875}
  ], [
    {name: "Period D", start: 505, end: 585},
    {name: "Brunch", start: 585, end: 600},
    {name: "FlexTime", start: 600, end: 650},
    {name: "Period E", start: 660, end: 735},
    {name: "Lunch", start: 735, end: 775},
    {name: "Period A", start: 775, end: 855},
    {name: "Period G", start: 865, end: 940}
  ], [
    {name: "Period B", start: 505, end: 590},
    {name: "Brunch", start: 590, end: 605},
    {name: "Period C", start: 605, end: 685},
    {name: "Period D", start: 695, end: 775},
    {name: "Lunch", start: 775, end: 815},
    {name: "Period F", start: 815, end: 895}
  ], [
    {name: "Period E", start: 505, end: 590},
    {name: "Brunch", start: 590, end: 605},
    {name: "FlexTime", start: 605, end: 655},
    {name: "Period B", start: 665, end: 735},
    {name: "Lunch", start: 735, end: 775},
    {name: "Period A", start: 775, end: 845},
    {name: "Period G", start: 855, end: 935}
  ], [
    {name: "Period C", start: 505, end: 580},
    {name: "Brunch", start: 580, end: 595},
    {name: "Period D", start: 595, end: 665},
    {name: "Period E", start: 675, end: 745},
    {name: "Lunch", start: 745, end: 785},
    {name: "Period F", start: 785, end: 855},
    {name: "Period G", start: 865, end: 935}
  ],
  null
],
times = [
  "2017-08-14T00%3A00%3A00.000-07%3A00",
  "2017-09-01T00%3A00%3A00.000-07%3A00",
  "2017-10-01T00%3A00%3A00.000-07%3A00",
  "2017-11-01T00%3A00%3A00.000-07%3A00",
  "2017-12-01T00%3A00%3A00.000-07%3A00",
  "2018-01-01T00%3A00%3A00.000-07%3A00",
  "2018-02-01T00%3A00%3A00.000-07%3A00",
  "2018-03-01T00%3A00%3A00.000-07%3A00",
  "2018-04-01T00%3A00%3A00.000-07%3A00",
  "2018-05-01T00%3A00%3A00.000-07%3A00",
  "2018-06-01T23%3A59%3A59.999-07%3A00"
],
monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
