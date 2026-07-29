package com.esgeasy.esg.reference;

import org.springframework.data.jpa.repository.JpaRepository;
import com.esgeasy.esg.tenant.MarketClassification;

public interface TransitionReliefRuleRepository extends JpaRepository<TransitionReliefRule, MarketClassification> {
}
