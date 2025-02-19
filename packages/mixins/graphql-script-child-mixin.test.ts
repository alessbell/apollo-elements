import type * as I from '@apollo-elements/core/types';

import type * as C from '@apollo/client/core';

import type { LitElement } from 'lit';

import type { SinonSpy } from 'sinon';

import { spy } from 'sinon';

import {
  setupApolloElementClass,
  setupQueryClass,
  setupMutationClass,
  setupSubscriptionClass,
  stringify,
  isApolloError,
  TestableElement,
} from '@apollo-elements/test';

import HelloQuery from '@apollo-elements/test/graphql/Hello.query.graphql';
import NoParamQuery from '@apollo-elements/test/graphql/NoParam.query.graphql';
import NoParamMutation from '@apollo-elements/test/graphql/NoParam.mutation.graphql';
import NoParamSubscription from '@apollo-elements/test/graphql/NoParam.subscription.graphql';

import { gql } from '@apollo/client/core';

import {
  assertType,
  restoreSpies,
  setupClient,
  teardownClient,
  waitForRender,
} from '@apollo-elements/test';

import { aTimeout, defineCE, expect, fixture, nextFrame } from '@open-wc/testing';

import { html as h, unsafeStatic } from 'lit/static-html.js';

import { GraphQLScriptChildMixin } from './graphql-script-child-mixin';

import { stub, SinonStub } from 'sinon';

const template = document.createElement('template');
template.innerHTML = `
  <output id="called"></output>
  <output id="data"></output>
  <output id="error"></output>
  <output id="errors"></output>
  <output id="loading"></output>
`;

import {
  ApolloElementMixin,
  ApolloQueryMixin,
  ApolloMutationMixin,
  ApolloSubscriptionMixin,
} from '@apollo-elements/mixins';

/* eslint-disable max-len */
class ApolloElementElement<D> extends ApolloElementMixin(HTMLElement)<D> {}
class ApolloMutationElement<D> extends ApolloMutationMixin(HTMLElement)<D> {}
class ApolloQueryElement<D> extends ApolloQueryMixin(HTMLElement)<D> {}
class ApolloSubscriptionElement<D> extends ApolloSubscriptionMixin(HTMLElement)<D> {}
/* eslint-enable max-len */

describe('GraphQLScriptChildMixin', function() {
  beforeEach(setupClient);

  afterEach(teardownClient);

  describe('on ApolloElement', function() {
    class Test<D extends C.TypedDocumentNode = C.TypedDocumentNode<any, any>>
      extends GraphQLScriptChildMixin(ApolloElementElement)<D> implements TestableElement {
      async hasRendered() { return this; }

      constructor() {
        super();
        this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true));
      }

      $(id: keyof this) { return this.shadowRoot!.getElementById(id as string); }
    }

    let element: Test;

    const setupFunction = setupApolloElementClass(Test);

    afterEach(function clearFixture() {
      element?.remove?.();
      // @ts-expect-error: just to clear the fixture
      element = undefined;
    });

    describe('without GraphQL script child', function() {
      let element: Test;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test {}));
        element = await fixture(h`<${tag}></${tag}>`);
      });

      it('has no document', function() {
        expect(element.document).to.be.null;
      });

      describe('then appending script child', function() {
        describe('when script is valid query', function() {
          beforeEach(function() {
            element.innerHTML = `<script type="application/graphql">query newQuery { new }</script>`;
          });

          beforeEach(nextFrame);

          it('sets document', function() {
            expect(element.document).to.deep.equal(gql`query newQuery { new }`);
          });
        });

        describe('when script is invalid', function() {
          beforeEach(function() {
            element.innerHTML = `<script>query newQuery { new }</script>`;
          });

          beforeEach(nextFrame);

          it('does not set document', async function() {
            expect(element.document).to.be.null;
          });
        });
      });
    });

    describe('with document property set via JavaScript', function() {
      beforeEach(async function setupElement() {
        ({ element } = await setupFunction<Test>({
          properties: {
            document: HelloQuery,
          },
        }));
      });

      describe('adding a script child', function() {
        beforeEach(function() {
          element.innerHTML = `
            <script type="application/graphql">{ daf { amud } }</script>
          `;
        });

        beforeEach(nextFrame);

        it('replaces the document', function() {
          expect(element.document).to.deep.equal(gql`{ daf { amud } }`);
        });
      });

      describe('if document is then nullified', function() {
        beforeEach(function() {
          element.document = null;
        });

        beforeEach(nextFrame);

        describe('adding a script child', function() {
          beforeEach(function() {
            element.innerHTML = `
              <script type="application/graphql">{ daf { amud } }</script>
            `;
          });

          beforeEach(nextFrame);

          it('sets the document from DOM', function() {
            expect(element.document).to.deep.equal(gql`{ daf { amud } }`);
          });
        });
      });
    });

    describe('with empty GraphQL script child', function() {
      let element: Test;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test { }));

        element = await fixture<Test>(h`
          <${tag}>
            <script type="application/graphql"></script>
          </${tag}>
        `);
      });

      it('has null document', function() {
        expect(element.document).to.be.null;
      });
    });

    describe('with invalid GraphQL script child', function() {
      let element: Test;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test { }));

        element = await fixture<Test>(h`
          <${tag}>
            <script type="application/graphql">haha</script>
          </${tag}>
        `);
      });

      it('has null document', function() {
        expect(element.document).to.be.null;
      });
    });

    describe('with valid GraphQL script child', function() {
      let element: Test;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test {}));

        element = await fixture<Test>(h`
          <${tag}>
            <script type="application/graphql">{ daf { amud } }</script>
          </${tag}>
        `);
      });

      it('sets document based on DOM', async function() {
        expect(element.document).to.deep.equal(gql`{ daf { amud } }`);
      });

      describe('setting script innerText', function() {
        beforeEach(function() {
          element.querySelector('script')!.innerText = '{ perek { piska } }';
        });

        beforeEach(nextFrame);

        it('gets document from DOM', function() {
          expect(element.document).to.deep.equal(gql`{ perek { piska } }`);
        });
      });

      describe('setting script textContent', function() {
        beforeEach(function() {
          element.querySelector('script')!.textContent = '{ perek { pasuk } }';
        });

        beforeEach(nextFrame);

        it('gets document from DOM', function() {
          expect(element.document).to.deep.equal(gql`{ perek { pasuk } }`);
        });
      });
    });

    describe('with GraphQL script src child', function() {
      let element: Test;

      beforeEach(function() {
        const s = stub(window, 'fetch');
        s.returns(Promise.resolve(new Response('query { x }')));
      });

      afterEach(function() {
        (window.fetch as SinonStub).restore();
      });

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test {}));

        element = await fixture<Test>(h`
          <${tag}>
            <script type="application/graphql" src="/query.graphql"></script>
          </${tag}>
        `);
      });

      beforeEach(() => aTimeout(100));

      it('fetches the script', async function() {
        expect(window.fetch).to.have.been.calledWith(`${window.location.origin}/query.graphql`);
      });

      it('sets the document', async function() {
        expect(element.document).to.deep.equal(gql`query { x }`);
      });
    });

    describe('without JSON script child', function() {
      let element: Test;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test {}));
        element = await fixture<Test>(h`
          <${tag}></${tag}>
        `);
      });

      it('does not set variables', function() {
        expect(element.variables).to.be.null;
      });

      describe('adding a JSON script child', function() {
        beforeEach(function() {
          const script = document.createElement('script');
          script.type = 'application/json';
          script.textContent = `{"hi":"low"}`;
          element.append(script);
        });

        beforeEach(nextFrame);

        it('sets the variables property', function() {
          expect(element.variables).to.deep.equal({ hi: 'low' });
        });
      });
    });

    describe('with empty JSON script child', function() {
      let element: Test;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test {}));
        element = await fixture<Test>(h`
          <${tag}><script type="application/json"></script></${tag}>
        `);
      });

      it('does not set variables', function() {
        expect(element.variables).to.be.null;
      });

      describe('setting the script textContent', function() {
        beforeEach(function() {
          element.querySelector('script[type="application/json"]')!.textContent = `{"hi":"low"}`;
        });

        beforeEach(nextFrame);

        it('sets the variables property', function() {
          expect(element.variables).to.deep.equal({ hi: 'low' });
        });
      });
    });

    describe('with invalid JSON script child', function() {
      let element: Test;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test {}));
        element = await fixture<Test>(h`
          <${tag}><script type="application/json">haha</script></${tag}>
        `);
      });

      it('does not set variables', function() {
        expect(element.variables).to.be.null;
      });
    });

    describe('with valid JSON script child', function() {
      let element: Test;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test {}));
        element = await fixture<Test>(h`
          <${tag}><script type="application/json">{"foo":"bar"}</script></${tag}>
        `);
      });

      it('sets variables', function() {
        expect(element.variables).to.deep.equal({ foo: 'bar' });
      });
    });

    describe('with GraphQL and JSON script children', function() {
      let element: Test;

      let calls = 0;

      beforeEach(async function() {
        const tag = unsafeStatic(defineCE(class extends Test {
          documentChanged() {
            calls++;
          }
        }));
        element = await fixture<Test>(h`
          <${tag}>
            <script type="application/graphql">{ foo { bar } }</script>
            <script type="application/json">{"foo":"bar"}</script>
          </${tag}>
        `);
      });

      describe('appending an unrelated elements', function() {
        beforeEach(function() {
          element.append(document.createElement('script'), document.createElement('p'));
        });

        it('does not affect the graphql document or variables', function() {
          expect(element.document).to.deep.equal(gql`{ foo { bar } }`);
          expect(element.variables).to.deep.equal({ 'foo': 'bar' });
          expect(calls).to.not.be.greaterThan(1);
        });
      });
    });
  });

  describe('on ApolloQuery', function() {
    class Test<D extends C.TypedDocumentNode = C.TypedDocumentNode<any, any>>
      extends GraphQLScriptChildMixin(ApolloQueryElement)<D>
      implements TestableElement {
      declare shadowRoot: ShadowRoot;

      constructor() {
        super();
        this.attachShadow({ mode: 'open' })
          .append(template.content.cloneNode(true));
      }

      render() {
        if (!this.shadowRoot) return;
        for (const x of Array.from(this.shadowRoot.querySelectorAll('[id]'), x => x.id))
          this.shadowRoot.getElementById(x)!.textContent = stringify(this[x as keyof this]);
      }

      update() {
        this.render();
      }

      async hasRendered() {
        await this.controller.host.updateComplete;
        return this;
      }

      $(id: keyof this) {
        return this.shadowRoot.getElementById(id as string);
      }
    }

    const setupFunction = setupQueryClass(Test);

    let element: Test;

    beforeEach(() => spy(window.__APOLLO_CLIENT__!, 'watchQuery'));
    afterEach(() => (window.__APOLLO_CLIENT__!.watchQuery as SinonSpy).restore?.());

    afterEach(function clearFixture() {
      element?.remove?.();
      // @ts-expect-error: just to clear the fixture
      element = undefined;
    });

    describe('with no script child', function() {
      beforeEach(async function setupElement() {
        ({ element } = await setupFunction());
      });

      describe('appending a script child with wrong type', function() {
        beforeEach(function appendWrongTypeScript() {
          element!.innerHTML = `<script type="app/gql">query { noParam }</script>`;
        });

        beforeEach(waitForRender(() => element));

        it('does not change document', function() {
          expect(element?.query).to.be.null;
        });
      });

      describe('appending an invalid GraphQL script child', function() {
        beforeEach(function appendBadScript() {
          element!.innerHTML = `<script type="application/graphql">quory { # hi }</script>`;
        });

        beforeEach(waitForRender(() => element));

        it('does not change document', function() {
          expect(element?.query).to.be.null;
        });

        it('sets error', function() {
          expect(element?.error?.message.includes('quory')).to.be.true;
        });
      });
    });

    describe('with NoParamQuery script child', function() {
      beforeEach(async function setupElement() {
        ({ element } =
          await setupFunction({
            innerHTML: `<script type="application/graphql">${NoParamQuery.loc!.source.body}</script>`,
          }));
      });

      beforeEach(waitForRender(() => element));

      beforeEach(nextFrame);

      it('does not remove script', function() {
        expect(element?.firstElementChild).to.be.an.instanceof(HTMLElement);
      });

      it('sets query property', function() {
        expect(element?.query).to.deep.equal(gql(NoParamQuery.loc!.source.body));
      });

      it('subscribes', function() {
        expect(element?.client?.watchQuery).to.have.been.called;
      });

      describe('changing the DOM script to HelloQuery', function() {
        beforeEach(function changeScript() {
          element!.innerHTML = `<script type="application/graphql">${HelloQuery.loc!.source.body}</script>`;
        });

        beforeEach(nextFrame);

        beforeEach(waitForRender(() => element));

        beforeEach(nextFrame);

        it('sets the query property', function() {
          expect(element?.shadowRoot?.getElementById('data')?.textContent)
            .to.equal(stringify({
              helloWorld: {
                __typename: 'HelloWorld',
                name: 'Chaver',
                greeting: 'Shalom',
              },
            }));
        });

        describe('setting the variables', function() {
          beforeEach(function setVariables() {
            element!.variables = { name: 'Aleichem' };
          });

          beforeEach(waitForRender(() => element));

          beforeEach(nextFrame);

          it('rerenders', function() {
            expect(element?.shadowRoot?.getElementById('data')?.textContent)
              .to.equal(stringify({
                helloWorld: {
                  __typename: 'HelloWorld',
                  name: 'Aleichem',
                  greeting: 'Shalom',
                },
              }));
          });
        });
      });
    });
  });

  describe('on ApolloMutation', function() {
    class Test<D extends C.TypedDocumentNode = C.TypedDocumentNode<any, any>>
      extends GraphQLScriptChildMixin(ApolloMutationElement)<D>
      implements TestableElement {
      $(id: keyof this) { return this.shadowRoot!.getElementById(id as string); }

      async hasRendered() { return this; }
    }

    const setupFunction = setupMutationClass(Test);

    let element: Test;

    afterEach(function clearFixture() {
      element?.remove?.();
      // @ts-expect-error: just to clear the fixture
      element = undefined;
    });

    describe('with NoParamMutation script child', function() {
      beforeEach(async function setupElement() {
        ({ element } = await setupFunction({
          innerHTML: `<script type="application/graphql">${NoParamMutation.loc!.source.body}</script>`,
        }));
      });

      it('does not remove the script', function() {
        expect(element.firstElementChild).to.be.an.instanceof(HTMLScriptElement);
      });

      it('sets the mutation property', function() {
        expect(element.firstElementChild).to.be.an.instanceof(HTMLScriptElement);
        expect(element.mutation).to.deep.equal(gql(NoParamMutation.loc!.source.body));
      });
    });
  });

  describe('on ApolloSubscription', function() {
    class Test<D extends C.TypedDocumentNode = C.TypedDocumentNode<any, any>>
      extends GraphQLScriptChildMixin(ApolloSubscriptionElement)<D>
      implements TestableElement {
      declare shadowRoot: ShadowRoot;

      async hasRendered() {
        await this.controller.host.updateComplete;
        return this;
      }

      $(id: keyof this) { return this.shadowRoot!.getElementById(id as string); }
    }

    const setupFunction = setupSubscriptionClass(Test);

    let element: Test;

    let spies: Record<string|keyof Test, SinonSpy>;

    afterEach(function clearFixture() {
      element?.remove?.();
      // @ts-expect-error: just to clear the fixture
      element = undefined;
    });

    describe('with NoParamSubscription script child', function() {
      beforeEach(function clientSpy() {
        // @ts-expect-error: spy
        window.__APOLLO_CLIENT__.subscribe?.restore?.();
        spies ??= {} as typeof spies;
        spies['client.subscribe'] = spy(window.__APOLLO_CLIENT__!, 'subscribe');
      });

      beforeEach(async function setupElement() {
        ({ element, spies } = await setupFunction({
          innerHTML: `
            <script type="application/graphql">${NoParamSubscription?.loc?.source.body}</script>
          `,
        }));
      });

      beforeEach(waitForRender(() => element));

      afterEach(restoreSpies(() => spies));

      it('does not remove the script', function() {
        expect(element?.firstElementChild).to.be.an.instanceof(HTMLScriptElement);
      });

      it('sets the subscription property', function() {
        expect(element?.subscription).to.deep.equal(gql(NoParamSubscription!.loc!.source.body));
      });

      it('calls subscribe()', function() {
        expect(element?.client?.subscribe).to.have.been.calledOnce;
      });
    });
  });
});

import {
  ApolloElement as LitApolloElement,
  ApolloQuery as LitApolloQuery,
} from '@apollo-elements/lit-apollo';

/* eslint-disable max-len, func-call-spacing, no-multi-spaces */
async function TypeCheck() {
  type D = { a: 'a', b: number };
  type V = { d: 'd', e: number };

  const Doc: C.TypedDocumentNode<D, V> = {} as C.TypedDocumentNode<D, V>;

  class TypeCheckElement extends GraphQLScriptChildMixin(ApolloElementElement)<typeof Doc> {
    typeCheck(): void {
      assertType<HTMLElement>                         (this);

      // ApolloElementInterface
      assertType<C.ApolloClient<C.NormalizedCacheObject>> (this.client!);
      assertType<Record<string, unknown>>             (this.context!);
      assertType<boolean>                             (this.loading);
      assertType<C.DocumentNode>                      (this.document!);
      assertType<Error>                               (this.error!);
      assertType<readonly I.GraphQLError[]>           (this.errors!);
      assertType<string>                              (this.error.message);
      if (isApolloError(this.error))
        assertType<readonly I.GraphQLError[]>         (this.error.graphQLErrors);
    }
  }

  class TypeCheckLitApolloElement extends GraphQLScriptChildMixin(LitApolloElement) {
    typeCheck(): void {
      assertType<Promise<unknown>>                        (this.updateComplete);
      assertType<LitElement>                              (this);

      // ApolloElementInterface
      assertType<C.ApolloClient<C.NormalizedCacheObject>> (this.client!);
      assertType<Record<string, unknown>>                 (this.context!);
      assertType<boolean>                                 (this.loading);
      assertType<C.DocumentNode>                          (this.document!);
      assertType<Error>                                   (this.error!);
      assertType<readonly I.GraphQLError[]>               (this.errors!);
      assertType<string>                                  (this.error.message);
      if (isApolloError(this.error))
        assertType<readonly I.GraphQLError[]>             (this.error.graphQLErrors);
    }
  }

  class TypeCheckQuery extends GraphQLScriptChildMixin(ApolloQueryElement)<typeof Doc> {
    variables = { d: 'd' as const, e: 0 };

    typeCheck(): void {
      assertType<HTMLElement>                         (this);

      // ApolloElementInterface
      assertType<C.ApolloClient<C.NormalizedCacheObject>> (this.client!);
      assertType<Record<string, unknown>>                 (this.context!);
      assertType<boolean>                                 (this.loading);
      assertType<C.DocumentNode>                          (this.document!);
      assertType<Error>                                   (this.error!);
      assertType<readonly I.GraphQLError[]>               (this.errors!);
      assertType<D>                                       (this.data!);
      assertType<string>                                  (this.error.message);
      assertType<'a'>                                     (this.data.a);
      // @ts-expect-error: b as number type
      assertType<'a'>                                 (this.data.b);
      assertType<V>                                   (this.variables);
      assertType<'d'>                                 (this.variables.d);
      assertType<number>                              (this.variables.e);
      if (isApolloError(this.error))
        assertType<readonly I.GraphQLError[]>         (this.error.graphQLErrors);

      // ApolloQueryInterface
      assertType<C.DocumentNode>                      (this.query!);
      assertType<C.ErrorPolicy>                       (this.errorPolicy!);
      // @ts-expect-error: ErrorPolicy is not a number
      assertType<number>                              (this.errorPolicy);
      assertType<C.WatchQueryFetchPolicy>             (this.fetchPolicy!);
      assertType<string>                              (this.fetchPolicy);
      if (typeof this.nextFetchPolicy !== 'function')
        assertType<C.WatchQueryFetchPolicy>           (this.nextFetchPolicy!);
      assertType<C.NetworkStatus>                     (this.networkStatus);
      assertType<number>                              (this.networkStatus);
      // @ts-expect-error: NetworkStatus is not a string
      assertType<string>                              (this.networkStatus);
      assertType<boolean>                             (this.notifyOnNetworkStatusChange!);
      assertType<number>                              (this.pollInterval!);
      assertType<boolean>                             (this.partial!);
      assertType<boolean>                             (this.partialRefetch!);
      assertType<boolean>                             (this.returnPartialData!);
      assertType<boolean>                             (this.noAutoSubscribe);
      assertType <Partial<C.WatchQueryOptions<V, D>>> (this.options!);
    }
  }

  class TypeCheckLitApolloQuery extends GraphQLScriptChildMixin(LitApolloQuery)<D, V> {
    variables = { d: 'd' as const, e: 0 };

    typeCheck(): void {
      assertType<LitElement>                          (this);

      assertType<D>                                   (this.data!);
      assertType<'a'>                                 (this.data.a);
      // @ts-expect-error: b as number type
      assertType<string>                              (this.data.b);
      assertType<V>                                   (this.variables);
      assertType<'d'>                                 (this.variables.d);
      assertType<number>                              (this.variables.e);
    }
  }

  class TypeCheckMutation extends GraphQLScriptChildMixin(ApolloMutationElement)<typeof Doc> {
    typeCheck(): void {
      assertType<HTMLElement>(this);

      // ApolloElementInterface
      assertType<C.ApolloClient<C.NormalizedCacheObject>>(this.client!);
      assertType<Record<string, unknown>>(this.context!);
      assertType<boolean>(this.loading);
      assertType<C.DocumentNode|null>(this.document);
      assertType<Error>(this.error!);
      assertType<readonly I.GraphQLError[]>(this.errors!);
      assertType<D>(this.data!);
      assertType<string>(this.error.message);
      assertType<'a'>(this.data.a);
      assertType<number>(this.data.b);
      if (isApolloError(this.error))
        assertType<readonly I.GraphQLError[]>(this.error.graphQLErrors);

      // ApolloMutationInterface
      assertType<C.DocumentNode|null>(this.mutation);
      assertType<V|null>(this.variables);
      assertType<boolean>(this.called);
      assertType<boolean>(this.ignoreResults!);
      assertType<boolean>(this.awaitRefetchQueries!);
      assertType<C.ErrorPolicy>(this.errorPolicy!);
      assertType<string>(this.errorPolicy!);
      // @ts-expect-error: ErrorPolicy is not a number
      assertType<number>(this.errorPolicy);
      assertType<string|undefined>(this.fetchPolicy);
      assertType<Extract<C.FetchPolicy, 'no-cache'>|undefined>(this.fetchPolicy);

      if (typeof this.refetchQueries === 'function')
        assertType<(result: C.FetchResult<D>) => I.RefetchQueriesType>(this.refetchQueries);
      else
        assertType<I.RefetchQueriesType|undefined>(this.refetchQueries!);

      if (typeof this.optimisticResponse !== 'function')
        assertType<D|undefined>(this.optimisticResponse);
      else
        assertType<(vars: V) => D>(this.optimisticResponse);
    }
  }

  class TypeCheckSubscription extends GraphQLScriptChildMixin(ApolloSubscriptionElement)<typeof Doc> {
    typeCheck(): void {
      assertType<HTMLElement>(this);

      // ApolloElementInterface
      assertType<C.ApolloClient<C.NormalizedCacheObject>>(this.client!);
      assertType<Record<string, unknown>>(this.context!);
      assertType<boolean>(this.loading);
      assertType<C.DocumentNode>(this.document!);
      assertType<Error>(this.error!);
      assertType<readonly I.GraphQLError[]>(this.errors!);
      assertType<D>(this.data!);
      assertType<string>(this.error.message);
      assertType<'a'>(this.data.a);
      // @ts-expect-error: b as number type
      assertType<'a'>(this.data.b);
      if (isApolloError(this.error))
        assertType<readonly I.GraphQLError[]>(this.error.graphQLErrors);

      // ApolloSubscriptionInterface
      assertType<C.DocumentNode>(this.subscription!);
      assertType<V>(this.variables!);
      assertType<C.FetchPolicy>(this.fetchPolicy!);
      assertType<string>(this.fetchPolicy);
      assertType<boolean>(this.notifyOnNetworkStatusChange!);
      assertType<number>(this.pollInterval!);
      assertType<boolean>(this.skip);
      assertType<boolean>(this.noAutoSubscribe);

      /* eslint-enable max-len, func-call-spacing, no-multi-spaces */
    }
  }
}
/* eslint-enable func-call-spacing, no-multi-spaces */
