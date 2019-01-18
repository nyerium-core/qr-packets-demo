/**
 * Types for helping make commit and dispatch methods in vuex stores type safe.
 * sources:
 * https://gist.github.com/bmingles/8dc0ddcb87aeb092beb5a12447b10a36
 * https://gist.github.com/wonderful-panda/46c072497f8731a2bde28da40e9ea2d7
 */

/**
 * Type defining the commit method portion of our store.
 */
export type Mutator<TMutationPayloadMap> = {
	commit: <T extends keyof TMutationPayloadMap>(
		mutationType: T,
		...payload: OptionalArg<T, TMutationPayloadMap[T]>
	) => void
}

type OptionalArg<T, P> = P extends undefined ? [] : [P]

/**
 * Type defining the dispatch method portion of our store.
 */
export type Dispatcher<TActionPayloadMap> = {
	dispatch: <T extends keyof TActionPayloadMap>(
		actionType: T,
		...payload: OptionalArg<T, TActionPayloadMap[T]>
	) => Promise<any>;
};

/**
 * Type for mapping action type strings to action payloads.
 */
export type ActionDictionary<TActionPayloadMap, TActionContext> = {
	[P in keyof TActionPayloadMap]: (
		store: TActionContext,
		payload: TActionPayloadMap[P],
	) => void;
};

export type ActionContext<
	TState,
	TDispatcher extends Dispatcher<any>,
	TMutator extends Mutator<any>,
	TGetters
	> =
		TDispatcher &
		TMutator &
		{ state: TState, rootGetters?: TGetters, rootState?: TState }

/**
 * Type for mapping mutation type strings to mutation payloads.
 */
export type MutationDictionary<TState, TMutationPayloadMap> = {
	[P in keyof TMutationPayloadMap]: (state: TState, ...payload: OptionalArg<P, TMutationPayloadMap[P]>) => void;
};

export type GettersDictionary<TState, TGettersReturnMap> = {
	[P in keyof TGettersReturnMap]: (
		state: TState,
		getters: TGettersReturnMap
	) => TGettersReturnMap[P]
}

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

type CommonProps<T1 extends {}, T2 extends {}> = {
	[P in (keyof T1 & keyof T2)]: T1[P] & T2[P]
}
type PropsFrom1<T1 extends {}, T2 extends {}> = {
	[P in Exclude<keyof T1, keyof T2>]: T1[P]
}
type PropsFrom2<T1 extends {}, T2 extends {}> = {
	[P in Exclude<keyof T2, keyof T1>]: T2[P]
}
type Merge<T1 extends {}, T2 extends {}> = CommonProps<T1, T2> & PropsFrom1<T1, T2> & PropsFrom2<T1, T2>

type Merge3<T1, T2, T3> = Merge<T3, Merge<T1, T2>>
type MergeMultiple<T1, T2 = unknown, T3 = unknown, T4 = unknown, T5 = unknown> = Merge3<T1, T2, Merge3<T3, T4, T5>>

export type Store<TState, TMutationPayloadMap, TActionPayloadMap, TGettersReturnMap> =
	Dispatcher<TActionPayloadMap> & Mutator<TMutationPayloadMap> & {
		readonly state: TState
		readonly getters: TGettersReturnMap
	}
/**
 * Type for options passed to new Vuex.Store()
 */
export type StoreOptions<TState, TMutationPayloadMap, TActionPayloadMap, TGettersReturnMap> =
	& OptionalField<keyof TGettersReturnMap, { getters: GettersDictionary<TState, TGettersReturnMap> }, {}>
	& OptionalField<keyof TState, { state: TState }, {}>
	& OptionalField<keyof TMutationPayloadMap, { mutations: MutationDictionary<TState, TMutationPayloadMap> }, {}>
	& OptionalField<keyof TState, { actions: ActionDictionary<TActionPayloadMap, ActionContext<
		TState,
		Dispatcher<TActionPayloadMap>,
		Mutator<TMutationPayloadMap>,
		TGettersReturnMap>>
	}, {}>

type OptionalField<TKeyType, TFieldObjectType, TNever> = [TKeyType] extends [never] ? TNever : TFieldObjectType