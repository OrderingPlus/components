import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../contexts/ApiContext'

export const ProjectForm = (props) => {
  const {
    UIComponent,
    setStoreData
  } = props

  const [ordering, { setOrdering }] = useApi()

  const [projectState, setProjectState] = useState({ data: null, loading: false })

  const onSubmit = (values) => {
    setProjectState({ data: values, loading: true })
    setOrdering({ ...ordering, project: values?.project_name })
    setStoreData('project_name', JSON.stringify(values?.project_name))
  }

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          projectState={projectState}
          setProjectState={setProjectState}
          onSubmit={onSubmit}
        />
      )}
    </>
  )
}

ProjectForm.propTypes = {
  /**
   * UI Component, this must be containt all graphic elements and use parent props
   */
  UIComponent: PropTypes.elementType
}
