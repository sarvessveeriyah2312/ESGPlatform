package com.esgeasy.esg.forecasting;

import com.esgeasy.esg.common.TenantOwnedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Caches the last AI-generated narrative/action-plan text for one indicator's forecast, so
 *  revisiting AI Forecasting redisplays it instead of re-calling (and re-billing) the provider —
 *  the user must explicitly click "Regenerate" to overwrite it with a fresh call. */
@Entity
@Table(name = "forecast_ai_draft", uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "indicator_definition_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ForecastAiDraft extends TenantOwnedEntity {

    @Column(name = "indicator_definition_id", nullable = false, length = 30)
    private String indicatorDefinitionId;

    @Column(columnDefinition = "TEXT")
    private String narrative;

    @Column(name = "action_plan", columnDefinition = "TEXT")
    private String actionPlan;
}
