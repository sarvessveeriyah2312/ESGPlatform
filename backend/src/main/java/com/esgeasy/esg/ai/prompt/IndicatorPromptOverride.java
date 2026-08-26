package com.esgeasy.esg.ai.prompt;

import com.esgeasy.esg.common.TenantOwnedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A company's customization of the "Extract with AI" prompt for one specific indicator — only
 * present once an admin edits it; absent means "use the shared indicator-value-extraction
 * default" (see IndicatorPromptService). Lets a computed/ratio indicator (e.g. "Energy Intensity
 * per Revenue", unit MWh/RM mil) get guidance a raw consumption indicator doesn't need, without
 * touching every other indicator's extraction behavior.
 */
@Entity
@Table(name = "indicator_prompt_override")
@Getter
@Setter
@NoArgsConstructor
public class IndicatorPromptOverride extends TenantOwnedEntity {

    @Column(name = "indicator_definition_id", nullable = false, length = 30)
    private String indicatorDefinitionId;

    @Column(name = "system_prompt", columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(name = "user_prompt_template", columnDefinition = "TEXT")
    private String userPromptTemplate;
}
