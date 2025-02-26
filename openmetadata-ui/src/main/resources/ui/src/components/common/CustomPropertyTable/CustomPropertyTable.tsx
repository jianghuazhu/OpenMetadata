/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { Table, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { AxiosError } from 'axios';
import Loader from 'components/Loader/Loader';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import {
  OperationPermission,
  ResourceEntity,
} from 'components/PermissionProvider/PermissionProvider.interface';
import { EntityField } from 'constants/Feeds.constants';
import { ERROR_PLACEHOLDER_TYPE } from 'enums/common.enum';
import { EntityType } from 'enums/entity.enum';
import { ChangeDescription } from 'generated/tests/testCase';
import { isEmpty, isUndefined } from 'lodash';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTypeByFQN } from 'rest/metadataTypeAPI';
import { getEntityName } from 'utils/EntityUtils';
import {
  getChangedEntityNewValue,
  getDiffByFieldName,
  getUpdatedExtensionDiffFields,
} from 'utils/EntityVersionUtils';
import { CustomProperty, Type } from '../../../generated/entity/type';
import { showErrorToast } from '../../../utils/ToastUtils';
import ErrorPlaceHolder from '../error-with-placeholder/ErrorPlaceHolder';
import {
  CustomPropertyProps,
  EntityDetails,
} from './CustomPropertyTable.interface';
import { ExtensionTable } from './ExtensionTable';
import { PropertyValue } from './PropertyValue';

export const CustomPropertyTable: FC<CustomPropertyProps> = ({
  entityDetails,
  handleExtensionUpdate,
  entityType,
  hasEditAccess,
  className,
  isVersionView,
  hasPermission,
}) => {
  const { t } = useTranslation();
  const { getEntityPermissionByFqn } = usePermissionProvider();
  const [entityTypeDetail, setEntityTypeDetail] = useState<Type>({} as Type);
  const [entityTypeDetailLoading, setEntityTypeDetailLoading] =
    useState<boolean>(false);

  const [typePermission, setPermission] = useState<OperationPermission>();

  const fetchTypeDetail = async () => {
    setEntityTypeDetailLoading(true);
    try {
      const res = await getTypeByFQN(entityType);

      setEntityTypeDetail(res);
    } catch (err) {
      showErrorToast(err as AxiosError);
    } finally {
      setEntityTypeDetailLoading(false);
    }
  };

  const fetchResourcePermission = async (entityType: EntityType) => {
    setEntityTypeDetailLoading(true);
    try {
      const permission = await getEntityPermissionByFqn(
        ResourceEntity.TYPE,
        entityType
      );

      setPermission(permission);
    } catch (error) {
      showErrorToast(
        t('server.fetch-entity-permissions-error', {
          entity: t('label.resource-permission-lowercase'),
        })
      );
    } finally {
      setEntityTypeDetailLoading(false);
    }
  };

  const onExtensionUpdate = async (
    updatedExtension: CustomPropertyProps['entityDetails']['extension']
  ) => {
    if (!isUndefined(handleExtensionUpdate)) {
      await handleExtensionUpdate({
        ...entityDetails,
        extension: updatedExtension,
      });
    }
  };

  const extensionObject: {
    extensionObject: EntityDetails['extension'];
    addedKeysList?: string[];
  } = useMemo(() => {
    if (isVersionView) {
      const changeDescription = entityDetails.changeDescription;
      const extensionDiff = getDiffByFieldName(
        EntityField.EXTENSION,
        changeDescription as ChangeDescription
      );

      const newValues = getChangedEntityNewValue(extensionDiff);

      if (extensionDiff.added) {
        const addedFields = JSON.parse(newValues ? newValues : [])[0];
        if (addedFields) {
          return {
            extensionObject: entityDetails.extension,
            addedKeysList: Object.keys(addedFields),
          };
        }
      }

      if (extensionDiff.updated) {
        return getUpdatedExtensionDiffFields(entityDetails, extensionDiff);
      }
    }

    return { extensionObject: entityDetails.extension };
  }, [isVersionView, entityDetails]);

  const tableColumn: ColumnsType<CustomProperty> = useMemo(() => {
    return [
      {
        title: t('label.name'),
        dataIndex: 'name',
        key: 'name',
        width: 200,
        render: (_, record) => getEntityName(record),
      },
      {
        title: t('label.value'),
        dataIndex: 'value',
        key: 'value',
        render: (_, record) => (
          <PropertyValue
            extension={extensionObject.extensionObject}
            hasEditPermissions={hasEditAccess}
            isVersionView={isVersionView}
            propertyName={record.name}
            propertyType={record.propertyType}
            versionDataKeys={extensionObject.addedKeysList}
            onExtensionUpdate={onExtensionUpdate}
          />
        ),
      },
    ];
  }, [
    entityDetails.extension,
    hasEditAccess,
    extensionObject,
    isVersionView,
    onExtensionUpdate,
  ]);

  useEffect(() => {
    if (typePermission?.ViewAll || typePermission?.ViewBasic) {
      fetchTypeDetail();
    }
  }, [typePermission]);

  useEffect(() => {
    fetchResourcePermission(entityType);
  }, [entityType]);

  if (entityTypeDetailLoading) {
    return <Loader />;
  }

  if (!hasPermission) {
    return (
      <div className="flex-center tab-content-height">
        <ErrorPlaceHolder type={ERROR_PLACEHOLDER_TYPE.PERMISSION} />
      </div>
    );
  }

  if (!isEmpty(entityTypeDetail.customProperties)) {
    return (
      <Table
        bordered
        className="m-md"
        columns={tableColumn}
        data-testid="custom-properties-table"
        dataSource={entityTypeDetail.customProperties || []}
        pagination={false}
        rowKey="name"
        size="small"
      />
    );
  }

  if (
    isEmpty(entityTypeDetail.customProperties) &&
    !isUndefined(entityDetails.extension)
  ) {
    return <ExtensionTable extension={entityDetails.extension} />;
  }

  return (
    <div className="flex-center tab-content-height">
      <ErrorPlaceHolder className={className}>
        <Typography.Paragraph>
          {t('message.adding-new-entity-is-easy-just-give-it-a-spin', {
            entity: t('label.custom-property-plural'),
          })}
        </Typography.Paragraph>
      </ErrorPlaceHolder>
    </div>
  );
};
