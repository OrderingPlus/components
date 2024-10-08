import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import utc from 'dayjs/plugin/utc'
import { useOrder } from '../../contexts/OrderContext'
dayjs.extend(isSameOrAfter)
dayjs.extend(utc)

/**
 * Component to manage moment option behavior without UI component
 */
export const MomentOption = (props) => {
  props = { ...defaultProps, ...props }
  const {
    minDate,
    maxDate,
    currentDate,
    useOrderContext,
    onChangeMoment,
    preorderSlotInterval,
    cateringPreorder,
    preorderLeadTime,
    business,
    UIComponent,
    preorderTimeRange,
    preorderMinimumDays
  } = props

  const [orderStatus, { changeMoment }] = useOrder()

  /**
   * Method to valid if a date is same of after current date
   * @param {String} date
   */
  const validDate = (date) => {
    if (!date) return
    const _date = dayjs(date, 'YYYY-MM-DD HH:mm').isSameOrAfter(dayjs(), 'day')
      ? dayjs(date).format('YYYY-MM-DD HH:mm')
      : dayjs().format('YYYY-MM-DD HH:mm')
    return _date
  }

  /**
   * Method to calculate diferrence between 2 dates
   * @param {moment} start
   * @param {moment} end
   */
  const calculateDiffDay = (start, end) => {
    const endVal = end ?? dayjs()
    const days = dayjs(start).diff(dayjs(endVal), 'day')
    return days
  }

  /**
   * This must be containt schedule selected by user
   */
  const _currentDate = useOrderContext ? orderStatus.options?.moment : currentDate
  const [scheduleSelected, setScheduleSelected] = useState(_currentDate ? dayjs.utc(validDate(_currentDate)).local().format('YYYY-MM-DD HH:mm') : null)

  /**
   * Flag to know if user select asap time
   */
  const [isAsap, setIsAsap] = useState(!scheduleSelected)

  /**
   * Arrays for save hours and dates lists
   */
  const [hoursList, setHourList] = useState([])
  const [datesList, setDatesList] = useState([])
  const [dateSelected, setDateSelected] = useState(dayjs(validDate(_currentDate)).add(preorderMinimumDays || 0, 'day').format('YYYY-MM-DD'))
  const [timeSelected, setTimeSelected] = useState(null)

  const handleChangeDate = (date) => {
    if (!date || date === dateSelected) return
    setDateSelected(date)
    setTimeSelected(null)
    setIsAsap(false)
    onChangeMoment && onChangeMoment(null)
  }

  const handleChangeTime = (time) => {
    if (!time || time === timeSelected) return
    const _moment = dayjs(`${dateSelected} ${time}`, 'YYYY-MM-DD HH:mm').toDate()
    setTimeSelected(time)
    setIsAsap(false)
    if (useOrderContext) {
      changeMoment(_moment)
    }
    onChangeMoment && onChangeMoment(_moment)
  }

  const handleAsap = () => {
    if (isAsap) return
    setIsAsap(true)
    if (useOrderContext) {
      changeMoment(null)
    }
    onChangeMoment && onChangeMoment(null)
  }

  useEffect(() => {
    if (useOrderContext) {
      if (orderStatus.options?.moment) {
        const _currentDate = dayjs.utc(validDate(orderStatus.options?.moment)).local()
        setScheduleSelected(_currentDate.format('YYYY-MM-DD HH:mm'))
        setDateSelected(_currentDate.format('YYYY-MM-DD'))
        setTimeSelected(_currentDate.format('HH:mm'))
        isAsap && setIsAsap(false)
      } else {
        dateSelected !== dayjs().format('YYYY-MM-DD') && setDateSelected(dayjs().format('YYYY-MM-DD'))
        timeSelected !== null && setTimeSelected(null)
        scheduleSelected !== null && setScheduleSelected(null)
        !isAsap && setIsAsap(true)
      }
    } else {
      scheduleSelected !== null && setScheduleSelected(null)
      !isAsap && setIsAsap(true)
    }
  }, [orderStatus.options?.moment])

  useEffect(() => {
    if (!scheduleSelected) {
      return
    }
    const selected = dayjs(scheduleSelected, 'YYYY-MM-DD HH:mm')
    const now = dayjs()
    const secondsDiff = selected.diff(now, 'seconds')
    if (secondsDiff <= 0) {
      handleAsap()
      return
    }

    const checkTime = setTimeout(() => {
      handleAsap()
    }, secondsDiff * 1000)

    return () => {
      clearTimeout(checkTime)
    }
  }, [scheduleSelected])

  const getActualSchedule = () => {
    const dayNumber = dayjs(dateSelected).day()
    const schedule = business?.schedule?.find?.((s, i) => dayNumber === i)
    return schedule?.enabled && schedule
  }

  useEffect(() => {
    if (isAsap && datesList[0]) {
      setDateSelected(datesList[preorderMinimumDays || 0])
      setTimeSelected(null)
    }
  }, [isAsap, datesList])

  /**
   * generate a list of available hours
   */
  const generateHourList = (preorderLeadTime, preorderTimeRange, preorderSlotInterval) => {
    const hoursAvailable = []

    const isToday = dateSelected === dayjs().format('YYYY-MM-DD')
    const isLastDate = dateSelected === dayjs(maxDate).format('YYYY-MM-DD')
    const now = new Date()
    if (!cateringPreorder) {
      for (let hour = 0; hour < 24; hour++) {
        /**
         * Continue if is today and hour is smaller than current hour
        */
        if (isToday && hour < now?.getHours()) continue
        /**
        * Continue if is max date and hour is greater than max date hour
        */
        if (isLastDate && hour > maxDate?.getHours()) continue
        for (let minute = 0; minute < 59; minute += 15) {
          /**
           * Continue if is today and hour is equal to current hour and minutes is smaller than current minute
          */
          if (isToday && hour === now?.getHours() && minute <= now.getMinutes()) continue
          /**
           * Continue if is today and hour is equal to max date hour and minutes is greater than max date minute
          */
          if (isLastDate && hour === maxDate?.getHours() && minute > maxDate.getMinutes()) continue
          const _hour = hour < 10 ? `0${hour}` : hour
          const startMinute = minute < 10 ? `0${minute}` : minute
          const endMinute = (minute + 14) < 10 ? `0${minute + 14}` : minute + 14
          const startTime = `${_hour}:${startMinute}`
          const endTime = `${_hour}:${endMinute}`
          hoursAvailable.push({
            startTime,
            endTime
          })
        }
      }
    } else {
      let startTimeAcc = preorderLeadTime
      let endTimeAcc = preorderTimeRange + preorderLeadTime
      while (startTimeAcc >= 0 && dayjs().startOf('day').add(startTimeAcc || 0, 'minute') < dayjs().startOf('day').add(1, 'day')) {
        const startTime = dayjs().startOf('day').add(startTimeAcc || 0, 'minute').format('HH:mm')
        const endTime = dayjs().startOf('day').add(endTimeAcc, 'minute').format('HH:mm')
        startTimeAcc = startTimeAcc + preorderSlotInterval
        endTimeAcc = endTimeAcc + preorderSlotInterval
        hoursAvailable.push({
          startTime,
          endTime
        })
      }
    }
    setHourList(hoursAvailable)
  }

  /**
   * Generate a list of available dates
   */
  const generateDatesList = () => {
    const datesList = []
    const diff = parseInt(calculateDiffDay(validDate(maxDate)), validDate(minDate))

    for (let i = 0; i < diff + 1; i++) {
      datesList.push(dayjs(validDate(minDate)).add(i, 'd').format('YYYY-MM-DD'))
    }
    setDatesList(datesList)
  }

  useEffect(() => {
    if (!dateSelected) return
    generateHourList(preorderLeadTime, preorderTimeRange, preorderSlotInterval)
  }, [dateSelected, preorderLeadTime, preorderTimeRange, preorderSlotInterval])

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = dayjs(dateSelected).diff(dayjs(currentDate), 'day')
      if (diff === 0) {
        generateHourList(preorderLeadTime, preorderTimeRange, preorderSlotInterval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [dateSelected, preorderLeadTime, preorderTimeRange, preorderSlotInterval])

  useEffect(() => {
    generateDatesList()
  }, [maxDate, minDate])

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          isAsap={isAsap}
          minDate={validDate(minDate)}
          maxDate={validDate(maxDate)}
          dateSelected={dateSelected}
          timeSelected={timeSelected}
          handleChangeDate={handleChangeDate}
          handleChangeTime={handleChangeTime}
          datesList={datesList}
          hoursList={hoursList}
          handleAsap={handleAsap}
          getActualSchedule={getActualSchedule}
          scheduleSelected={scheduleSelected}
        />
      )}
    </>
  )
}

MomentOption.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType,
  /**
   * minDate, this must be contains a custom date selected
   */
  minDate: PropTypes.instanceOf(Date),
  /**
   * maxDate, this must be contains a custom date selected
   */
  maxDate: PropTypes.instanceOf(Date).isRequired,
  /**
   * currentDate, this must be contains a custom date selected
   */
  currentDate: PropTypes.instanceOf(Date),
  /**
   * currentDate, this must be contains a custom date selected
   */
  useOrderContext: PropTypes.bool,
  /**
   * Method to return moment selection
   */
  onChangeMoment: PropTypes.func
}

const defaultProps = {
  useOrderContext: true,
  preorderSlotInterval: 15,
  preorderLeadTime: 0,
  preorderTimeRange: 30
}
