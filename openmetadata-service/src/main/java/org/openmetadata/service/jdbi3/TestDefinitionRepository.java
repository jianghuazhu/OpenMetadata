package org.openmetadata.service.jdbi3;

import static org.openmetadata.service.Entity.TEST_DEFINITION;

import org.openmetadata.common.utils.CommonUtil;
import org.openmetadata.schema.tests.TestDefinition;
import org.openmetadata.service.resources.dqtests.TestDefinitionResource;
import org.openmetadata.service.util.EntityUtil;

public class TestDefinitionRepository extends EntityRepository<TestDefinition> {
  public TestDefinitionRepository(CollectionDAO dao) {
    super(
        TestDefinitionResource.COLLECTION_PATH,
        TEST_DEFINITION,
        TestDefinition.class,
        dao.testDefinitionDAO(),
        dao,
        "",
        "");
  }

  @Override
  public TestDefinition setFields(TestDefinition entity, EntityUtil.Fields fields) {
    return entity; // Nothing to set
  }

  @Override
  public TestDefinition clearFields(TestDefinition entity, EntityUtil.Fields fields) {
    return entity; // Nothing to set
  }

  @Override
  public void prepare(TestDefinition entity) {
    // validate test platforms
    if (CommonUtil.nullOrEmpty(entity.getTestPlatforms())) {
      throw new IllegalArgumentException("testPlatforms must not be empty");
    }
  }

  @Override
  public void storeEntity(TestDefinition entity, boolean update) {
    store(entity, update);
  }

  @Override
  public void storeRelationships(TestDefinition entity) {
    // No relationships to store beyond what is stored in the super class
  }

  @Override
  public EntityUpdater getUpdater(TestDefinition original, TestDefinition updated, Operation operation) {
    return new TestDefinitionUpdater(original, updated, operation);
  }

  public class TestDefinitionUpdater extends EntityUpdater {
    public TestDefinitionUpdater(TestDefinition original, TestDefinition updated, Operation operation) {
      super(original, updated, operation);
    }

    @Override
    public void entitySpecificUpdate() {
      recordChange("testPlatforms", original.getTestPlatforms(), updated.getTestPlatforms());
      recordChange("supportedDataTypes", original.getSupportedDataTypes(), updated.getSupportedDataTypes());
      recordChange("parameterDefinition", original.getParameterDefinition(), updated.getParameterDefinition());
    }
  }
}
