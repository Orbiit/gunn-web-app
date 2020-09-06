export const normalSchedules = [
  null,
  [
    {name: "Period A", start: 505, end: 585},
    {name: "Brunch", start: 585, end: 590},
    {name: "Period B", start: 600, end: 675},
    {name: "Period C", start: 685, end: 760},
    {name: "Lunch", start: 760, end: 790},
    {name: "Period F", start: 800, end: 875}
  ], [
    {name: "Period D", start: 505, end: 585},
    {name: "Brunch", start: 585, end: 590},
    {name: "FlexTime", start: 600, end: 650},
    {name: "Period E", start: 660, end: 735},
    {name: "Lunch", start: 735, end: 765},
    {name: "Period A", start: 775, end: 855},
    {name: "Period G", start: 865, end: 940}
  ], [
    {name: "Period B", start: 505, end: 590},
    {name: "Brunch", start: 590, end: 595},
    {name: "Period C", start: 605, end: 685},
    {name: "Period D", start: 695, end: 775},
    {name: "Lunch", start: 775, end: 805},
    {name: "Period F", start: 815, end: 895}
  ], [
    {name: "Period E", start: 505, end: 590},
    {name: "Brunch", start: 590, end: 595},
    {name: "FlexTime", start: 605, end: 655},
    {name: "Period B", start: 665, end: 735},
    {name: "Lunch", start: 735, end: 765},
    {name: "Period A", start: 775, end: 845},
    {name: "Period G", start: 855, end: 935}
  ], [
    {name: "Period C", start: 505, end: 580},
    {name: "Brunch", start: 580, end: 585},
    {name: "Period D", start: 595, end: 665},
    {name: "Period E", start: 675, end: 745},
    {name: "Lunch", start: 745, end: 775},
    {name: "Period F", start: 785, end: 855},
    {name: "Period G", start: 865, end: 935}
  ],
  null
];

export const firstDay = "2020-08-17T00:00:00.000-07:00";
export const lastDay = "2021-06-03T23:59:59.999-07:00";
export const keywords = ["self", "schedule", "extended", "holiday", "no students", "no school", "break", "development"];

export const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const legalHashDateRegex = /^#20[0-9]{2}-[01][0-9]-[0-3][0-9]$/;
