import React from 'react';
import { ProjectGlyph } from '../ProjectGlyph.jsx';
import { getProjectType } from '../../api/projectContract.js';
export function ProjectPill({ project, editing = false, onChange }) {
  return (
    <div className="activity-project-banner">
      <ProjectGlyph type={getProjectType(project)} />
      {editing ? (
        <input
          aria-label="Título do projeto"
          value={project.titulo}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <span title={project.titulo}>{project.titulo}</span>
      )}
    </div>
  );
}
