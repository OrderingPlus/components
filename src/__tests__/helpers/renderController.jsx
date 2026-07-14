import React from 'react'
import { render, screen } from '@testing-library/react'
import { EventProvider } from '../../contexts/EventContext'

export let lastControllerProps = null

export const ControllerUI = (props) => {
  lastControllerProps = props
  return <div data-testid='controller-ui' />
}

export const renderController = (Controller, props = {}, options = {}) => {
  lastControllerProps = null
  const { wrapper: Wrapper = ({ children }) => <EventProvider>{children}</EventProvider> } = options
  return render(
    <Wrapper>
      <Controller UIComponent={ControllerUI} {...props} />
    </Wrapper>
  )
}

export const getControllerUI = () => screen.getByTestId('controller-ui')
