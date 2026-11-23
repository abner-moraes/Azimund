import React, { useState } from 'react';
import { IconButton } from '../../common/IconButton.jsx';
import { FeatureProperties } from './FeatureProperties.jsx';
import { ObjectList } from './ObjectList.jsx';

export function EditorSidebar({ draft, drawing, pages }) {
  const [collapsed, setCollapsed] = useState(false);
  const { feature, readOnly, setSelected, updateProperties, removeFeature } = drawing;
  return (
    <section
      className={`editor-objects ${collapsed ? 'collapsed' : ''}`}
      aria-label={feature ? 'Propriedades' : 'Objetos'}
    >
      <div className="editor-row objects-heading">
        <IconButton
          name={collapsed ? 'add' : feature ? 'arrow_back' : 'remove'}
          label={
            feature
              ? 'Voltar para objetos'
              : collapsed
                ? 'Expandir objetos'
                : 'Recolher objetos'
          }
          onClick={() => (feature ? setSelected(null) : setCollapsed(!collapsed))}
        />
        <span>{feature ? 'Propriedades' : 'Objetos'}</span>
      </div>
      {!collapsed &&
        (feature ? (
          <FeatureProperties
            feature={feature}
            readOnly={readOnly}
            onChange={updateProperties}
            onRemove={() => removeFeature(feature.id)}
          />
        ) : (
          <ObjectList draft={draft} drawing={drawing} pages={pages} />
        ))}
    </section>
  );
}
