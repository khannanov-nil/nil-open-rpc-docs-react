import React, { createRef, useEffect } from "react";
import validator from '@rjsf/validator-ajv8';
import { IconButtonProps, ArrayFieldTemplateProps, RJSFSchema, UiSchema, ArrayFieldTemplateItemType } from '@rjsf/utils';
import { ContentDescriptorObject, ExampleObject, ExamplePairingObject, MethodObject } from '@open-rpc/meta-schema';
import traverse from "@json-schema-tools/traverse";
import Form from '@rjsf/core';
import ArrayFieldTemplate from '../ArrayFieldTemplate/ArrayFieldTemplate';
import ArrayFieldItemTemplate from '../ArrayFieldItemTemplate/ArrayFieldItemTemplate';
import FieldErrorTemplate from "../FieldErrorTemplate/FieldErrorTemplate";
import FieldTemplate from "../FieldTemplate/FieldTemplate";
import ObjectFieldTemplate from "../ObjectFieldTemplate/ObjectFieldTemplate";
const qs = require('qs');
const { useHistory, useLocation } = require('@docusaurus/router');
import { RequestManager, HTTPTransport, Client } from "@open-rpc/client-js";

const uiSchema: UiSchema = {
  'ui:description': '',
  "ui:submitButtonOptions": {
    "norender": true,
  }
};

interface Props {
  method: MethodObject;
  selectedExamplePairing?: ExamplePairingObject;
  components?: {
    CodeBlock: React.FC<{ children: string, className?: string }>;
  };
}

function AddButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  return (
    <button {...btnProps} className={btnProps.className + " button button--primary"} type='button'>+</button>
  );
}

function RemoveButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  const style = {
    ...btnProps.style,
    minWidth: '35px',
    maxWidth: '36px',
    border: undefined
  };
  return (
    <button {...btnProps} style={style} className="button button--outline button--primary" type='button'>-</button>
  );
}
function MoveUpButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  const style = {
    ...btnProps.style,
    minWidth: '35px',
    maxWidth: '36px',
  };
  return (
    <button {...btnProps} style={style} className="button button--outline button--primary" type='button'>▲</button>
  );
}

function MoveDownButton(props: IconButtonProps) {
  const { icon, iconType, ...btnProps } = props;
  const style = {
    ...btnProps.style,
    minWidth: '35px',
    maxWidth: '36px',
  };
  return (
    <button {...btnProps} style={style} className="button button--outline button--primary" type='button'>▼</button>
  );
}

interface APIProps {
  onChange: (event: any) => void;
}

const TokenForm: React.FC<APIProps> = (props) => {
  const schema: RJSFSchema = {
    title: undefined,
    type: 'string'
  };
  return (
    <Form
      schema={schema}
      showErrorList={false}
      uiSchema={uiSchema}
      validator={validator}
      templates={{
        ArrayFieldItemTemplate,
        ArrayFieldTemplate,
        FieldErrorTemplate,
        FieldTemplate,
        ButtonTemplates: { AddButton, RemoveButton, MoveUpButton, MoveDownButton },
        ObjectFieldTemplate
      }}
      onChange={props.onChange}
    />
  );
}

const UsernameForm: React.FC<APIProps> = (props) => {
  const schema: RJSFSchema = {
    title: undefined,
    type: 'string',
  };
  return (
    <Form
      schema={schema}
      showErrorList={false}
      uiSchema={uiSchema}
      validator={validator}
      templates={{
        ArrayFieldItemTemplate,
        ArrayFieldTemplate,
        FieldErrorTemplate,
        FieldTemplate,
        ButtonTemplates: { AddButton, RemoveButton, MoveUpButton, MoveDownButton },
        ObjectFieldTemplate
      }}
      onChange={props.onChange}
    />
  );
}

interface ParamProps {
  param: ContentDescriptorObject;
  onChange: (event: any) => void;
  refref: any;
  formData: any;
}
const InteractiveMethodParam: React.FC<ParamProps> = (props) => {

  const { param, refref } = props;

  const schema = traverse(
    param.schema,
    (s) => {
      if (typeof s === 'boolean') {
        return s;
      }
      s.description = undefined;
      s.summary = undefined;
      return s;
    },
    { mutable: false }
  );
  schema.title = undefined;
  useEffect(() => {

  }, []);
  return (
    <Form
      schema={schema}
      formData={props.formData}
      showErrorList={false}
      uiSchema={uiSchema}
      validator={validator}
      ref={refref}
      templates={{
        ArrayFieldItemTemplate,
        ArrayFieldTemplate,
        FieldErrorTemplate,
        FieldTemplate,
        ButtonTemplates: { AddButton, RemoveButton, MoveUpButton, MoveDownButton },
        ObjectFieldTemplate
      }}
      onChange={props.onChange}
    />
  );
}

const InteractiveMethod: React.FC<Props> = (props) => {
  const history = useHistory();
  const queryString = qs.parse(history.location.search, {
    ignoreQueryPrefix: true,
    decoder: (
      value: string,
      defaultEncoder: any,
      _: string,
      type: "key" | "value",
    ) => {
      if (type === "key") {
        return defaultEncoder(value);
      }
      if (/^(\d+|\d*\.\d+)$/.test(value)) {
        return parseFloat(value);
      }
      const keywords: any = {
        true: true,
        false: false,
        null: null,
        undefined,
      };
      if (value in keywords) {
        return keywords[value];
      }

      try {
        return decodeURIComponent(value);
      } catch (e) {
        return value;
      }
    },
  })
  const { method, components, selectedExamplePairing } = props;
  const [requestParams, setRequestParams] = React.useState<any>(queryString || {});
  const [executionResult, setExecutionResult] = React.useState<any>();
  const [username, setUsername] = React.useState<string>();
  const [token, setToken] = React.useState<string>();
  const formRefs = method.params.map(() => createRef());

  useEffect(() => {
    if (!selectedExamplePairing || Object.keys(queryString).length > 0) {
      return;
    }
    const defaultFormData = selectedExamplePairing?.params.reduce((memo: any, exampleObject, i) => {
      const ex = exampleObject as ExampleObject;
      memo[(method.params[i] as ContentDescriptorObject).name] = ex.value;
      return memo;
    }, {})
    setRequestParams(defaultFormData);
  }, [selectedExamplePairing]);


  const handleChange = (change: any, i: number) => {
    setRequestParams((val: any) => {
      const newVal = {
        ...val,
        [(method.params[i] as ContentDescriptorObject).name]: change.formData,
      }
      history.replace({
        search: qs.stringify(newVal, { encode: false }),
      });
      return newVal;
    });
  };

  const handleTokenChange = (change: any) => {
    setToken(change.formData);
  }

  const handleUsernameChange = (change: any) => {
    setUsername(change.formData);
  }

  function formatMethodString(input: any) {
    let camelCaseString = input
      .split(/(?=[A-Z])|_/)
      .map((word: any, index: any) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    return 'eth_' + camelCaseString;
  }

  function createEndpoint() {
    return `https://api.devnet.nil.foundation/api/${username}/${token}`;
  }

  const methodCall = {
    method: formatMethodString(method.name),
    params: method.paramStructure === "by-name" ? requestParams : method.params.map((p, i) => requestParams[(p as ContentDescriptorObject).name] || undefined),
  };

  async function sendJsonRpcRequest() {
    const transport = new HTTPTransport(`https://sheltered-chamber-42279-c5a8a55ce26e.herokuapp.com/${createEndpoint()}`);
    const client = new Client(new RequestManager([transport]));

    try {
      const response = await client.request({
        method: methodCall.method,
        params: methodCall.params
      });
      setExecutionResult(response);
    } catch (e) {
      setExecutionResult(e);
    }
  }



  const curlCode = `curl -X POST ${createEndpoint()} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(methodCall, null, "  ")}'`;

  return (
    <div className="container">
      <div className="row">
        <h3>API credentials</h3>
        <div className="col col--12">
          <h4>Username</h4>
          <UsernameForm
            onChange={(change) => handleUsernameChange(change)}></UsernameForm>
          <h4>Token</h4>
          <TokenForm
            onChange={(change) => handleTokenChange(change)}
          />
        </div>
      </div>
      {
        method.params.length > 0 &&
        <>
          <div className="row">
            <h3>Params</h3>
            <div className="col col--12">
              {method.params.map((p, i) => (
                <>
                  <h4>{(p as ContentDescriptorObject).name}</h4>
                  <InteractiveMethodParam
                    refref={formRefs[i]}
                    formData={requestParams[(p as ContentDescriptorObject).name]}
                    onChange={(change) => handleChange(change, i)}
                    param={p as ContentDescriptorObject} />
                </>
              ))}
            </div>
          </div>
          <br />
        </>
      }
      <div className="row">
        <h3>Request</h3>
        <div className="col col--12">
          {components && components.CodeBlock && <components.CodeBlock className="language-js">{curlCode}</components.CodeBlock>}
          {!components?.CodeBlock &&
            <pre>
              <code>
                {curlCode}
              </code>
            </pre>
          }
        </div>
      </div>
      {
        executionResult !== undefined && <div className="row">
          <h3>Response</h3>
          <div className="col col--12">
            {components && components.CodeBlock && <components.CodeBlock className="language-json">{JSON.stringify(executionResult, null, '  ')}</components.CodeBlock>}
            {!components?.CodeBlock &&
              <pre>
                <code>
                  {JSON.stringify(executionResult, null, '  ')}
                </code>
              </pre>
            }
          </div>
        </div>
      }
      <div className="row">
        <button className="button button--primary button--block" onClick={() => sendJsonRpcRequest()}>
          Send Request
        </button>
      </div>
    </div >
  );

}

export default InteractiveMethod;
