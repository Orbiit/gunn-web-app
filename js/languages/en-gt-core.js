function duration ({ T: minutes }) {
  if (minutes < 1) return 'Do not To One Minute bell'
  return (
    (minutes >= 120
      ? Math.floor(minutes / 60) + ' small Time'
      : minutes >= 60
      ? 'One small Time'
      : '') +
    (minutes % 60 === 0
      ? ''
      : (minutes >= 60 ? ' with ' : '') +
        (minutes % 60 === 1
          ? 'One Minute bell'
          : (minutes % 60) + ' Minute bell'))
  )
}

function dueDate ({ P: periodSpan, D: dateStr }) {
  return (
    'To period day period: ' + (periodSpan ? periodSpan + ' in ' : '') + dateStr
  )
}
