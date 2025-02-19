import type * as C from '@apollo/client/core';

import type {
  Data,
  Variables,
  ComponentDocument,
  OptimisticResponseType,
  RefetchQueriesType,
  MutationUpdaterFn,
  VariablesOf,
} from '@apollo-elements/core/types';

import { controlled } from '@apollo-elements/core/decorators';

import { property, state } from 'lit/decorators.js';

import { ApolloMutationController } from '@apollo-elements/core/apollo-mutation-controller';

import { ApolloElement } from './apollo-element.js';

/**
 * `ApolloMutation`
 *
 * 👩‍🚀 Custom element base class to issue mutations via your Apollo cache.
 *
 * See [`ApolloMutationInterface`](https://apolloelements.dev/api/core/interfaces/mutation) for more information on events
 *
 */
export class ApolloMutation<D = unknown, V = VariablesOf<D>> extends ApolloElement<D, V> {
  /**
   * Latest mutation data.
   */
  declare data: Data<D> | null;

  /**
   * An object that maps from the name of a variable as used in the mutation GraphQL document to that variable's value.
   *
   * @summary Mutation variables.
   */
  declare variables: Variables<D, V> | null;

  controller = new ApolloMutationController<D, V>(this, null, {
    onCompleted: data => this.onCompleted?.(data),
    onError: error => this.onError?.(error),
  });

  /**
   * @summary Whether the mutation was called
   */
  @controlled()
  @property({ type: Boolean, reflect: true })
    called = false;

  /** @summary The mutation. */
  @controlled()
  @state()
    mutation: ComponentDocument<D, V> | null = null;

  /**
   * An object that represents the result of this mutation that will be optimistically
   * stored before the server has actually returned a result, or a unary function that
   * takes the mutation's variables and returns such an object.
   *
   * This is most often used for optimistic UI, where we want to be able to see
   * the result of a mutation immediately, and update the UI later if any errors
   * appear.
   * @example <caption>Using a function</caption>
   * ```ts
   *         element.optimisticResponse = ({ name }: HelloMutationVariables) => ({
   *           __typename: 'Mutation',
   *           hello: {
   *             __typename: 'Greeting',
   *             name,
   *           },
   *         });
   * ```
   */
  @controlled({ path: 'options' })
  @state()
    optimisticResponse?: OptimisticResponseType<D, V>;

  /**
   * @summary If true, the returned data property will not update with the mutation result.
   */
  @controlled({ path: 'options' })
  @property({ attribute: 'ignore-results', type: Boolean })
    ignoreResults = false;

  /**
   * Queries refetched as part of refetchQueries are handled asynchronously,
   * and are not waited on before the mutation is completed (resolved).
   * Setting this to true will make sure refetched queries are completed
   * before the mutation is considered done. false by default.
   * @attr await-refetch-queries
   */
  @controlled({ path: 'options' })
  @property({ attribute: 'await-refetch-queries', type: Boolean })
    awaitRefetchQueries?: boolean;

  /**
   * Specifies the ErrorPolicy to be used for this mutation.
   * @attr error-policy
   */
  @controlled({ path: 'options' })
  @property({ attribute: 'error-policy' })
    errorPolicy?: C.ErrorPolicy;

  /**
   * Specifies the FetchPolicy to be used for this mutation.
   * @attr fetch-policy
   */
  @controlled({ path: 'options' })
  @property({ attribute: 'fetch-policy' })
    fetchPolicy?: 'no-cache';

  /**
   * A list of query names which will be refetched once this mutation has returned.
   * This is often used if you have a set of queries which may be affected by a mutation and will have to update.
   * Rather than writing a mutation query reducer (i.e. `updateQueries`) for this,
   * you can refetch the queries that will be affected
   * and achieve a consistent store once these queries return.
   * @attr refetch-queries
   */
  @controlled({ path: 'options' })
  @property({
    attribute: 'refetch-queries',
    converter: {
      fromAttribute(newVal) {
        return !newVal ? null : newVal
          .split(',')
          .map(x => x.trim());
      },
    },
  }) refetchQueries: RefetchQueriesType<D> | null = null;

  /**
   * A function which updates the apollo cache when the query responds.
   * This function will be called twice over the lifecycle of a mutation.
   * Once at the very beginning if an optimisticResponse was provided.
   * The writes created from the optimistic data will be rolled back before
   * the second time this function is called which is when the mutation has
   * succesfully resolved. At that point update will be called with the actual
   * mutation result and those writes will not be rolled back.
   *
   * The reason a DataProxy is provided instead of the user calling the methods
   * directly on ApolloClient is that all of the writes are batched together at
   * the end of the update, and it allows for writes generated by optimistic
   * data to be rolled back.
   */
  public updater?(
    ...params: Parameters<MutationUpdaterFn<Data<D>, Variables<D, V>>>
  ): ReturnType<MutationUpdaterFn<Data<D>, Variables<D, V>>>;

  public mutate(
    params?: Partial<C.MutationOptions<Data<D>, Variables<D, V>>>
  ): Promise<C.FetchResult<Data<D>>> {
    return this.controller.mutate({
      ...params,
      update: params?.update ?? this.updater,
    });
  }

  /**
   * Callback for when a mutation is completed.
   */
  onCompleted?(data: Data<D> | null): void

  /**
   * Callback for when an error occurs in mutation.
   */
  onError?(error: Error): void
}
