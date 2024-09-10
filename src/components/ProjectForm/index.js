import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useApi } from '../../contexts/ApiContext'

export const ProjectForm = (props) => {
  const {
    UIComponent,
    setStoreData
  } = props

  const [ordering, { setOrdering }] = useApi()

  const [projectName, setProjectName] = useState(null)
  const [isLoadingProject, setLoadingProject] = useState(false)

  const onSubmit = (values) => {
    setLoadingProject(true)
    setProjectName(values)
    setOrdering({ ...ordering, project: values?.project_name })
    setStoreData('project_name', JSON.stringify(values?.project_name))
  }

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          projectName={projectName}
          isLoadingProject={isLoadingProject}
          onSubmit={onSubmit}
          setLoadingProject={setLoadingProject}
          setProjectName={setProjectName}
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
