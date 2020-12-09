// So at the project we use a lot of BaconJS...
import * as Bacon from 'baconjs'

// We use a ton of combineTemplate for composing observables
// To makes things clearer for use, we use a naming convention:
//
// Type                 Suffix     Example
// Bacon.Property       P          paymentCardIdP
// Bacon.EventStream    S          showCookieConsentS

type ExampleTemplate = {
    // Properties must end with P
    paymentCardIdP: Bacon.Property<string>,
    // EventStreams must end with S
    showCookieConsentS: Bacon.EventStream<true>,
    // And we don't care about regular values
    regularValue: string
}

// This works well for us, but since it's not enforced at compile time it's just a convention.
const subtlyWrongTemplate = Bacon.combineTemplate({
    // actually an event stream!
    thisIsDefinitelyAPropertyP: Bacon.repeatedly(1000, ["a", "b", "c"]),
    justARegularvalue: Bacon.constant("oops!")
})

// Could we enforce it at compile time, though?
// Absolutely!

// Should we?
// Maybe?



// TS 4.1 Key Remapping in Mapped Types
type PropsOfType<T extends object, F> = {
  [K in keyof T as T[K] extends F ? K : never]: T[K]
}

// TS 4.1 Template Literal Types
type PropsWithSuffix<T extends object, Suffix extends string> = {
  [K in keyof T as K extends `${string}${Suffix}` ? K : never]: T[K]
}

type PropertyNamedProps<T extends object> = PropsWithSuffix<T, 'P'>
type PropertyProps<T extends object> = PropsOfType<T, Bacon.Property<any>>

type EventStreamNamedProps<T extends object> = PropsWithSuffix<T, 'S'>
type EventStreamProps<T extends object> = PropsOfType<T, Bacon.EventStream<any>>

// Two types are equal if they extend each other
type Equal<A, B> = A extends B ? B extends A ? true : false : false

type ValidatedTemplate<T extends object> =
  [
    Equal<PropertyNamedProps<T>, PropertyProps<T>>,
    Equal<EventStreamNamedProps<T>, EventStreamProps<T>>
  ] extends [true, true] ? T : never

function validateTemplate<T extends object>(template: ValidatedTemplate<T>): T {
  return template
}

const validated = validateTemplate({
  paymentCardIdP: Bacon.constant("1234-5678"),
  showCookieConsentS: Bacon.repeatedly(1000, [true]),
  regularValue: 10
})

const shouldBeInvalid = validateTemplate({
    // fails because of no suffix
    paymentCardId: Bacon.constant("1234-5678"),

    // should have P suffix
    showCookieConsentS: Bacon.constant(true)
})


// So the template is now validated - awesome.
// But we also want to get rid of the suffixes after we've resolved the values.
// We can do that with the type system too.


type TrimSuffix<T, Suffix extends string> =
  T extends `${infer Root}${Suffix}` ? Root : T

// This is the type of a resolved BaconJS template
type ResolvedTemplate<T> =
    T extends Bacon.Observable<infer O> ? O :
    T extends Array<any> ? { [I in keyof T]: ResolvedTemplate<T[I]> } :
    T extends object ? { [K in keyof T as TrimSuffix<K, "S" | "P">]: ResolvedTemplate<T[K]> } : T

type ArrayOfNumbersExample = ResolvedTemplate<{
    rowTotalsP: Bacon.Property<number[]>
    rowTotals2P: Array<Bacon.Property<number>>
}>

function oegyCombineTemplate<T extends object>(template: ValidatedTemplate<T>): Bacon.Property<ResolvedTemplate<T>> {
    // Unfortunately the compiler cannot verify this implementation
    const transformedTemplate = Object.fromEntries(
        Object.entries(template)
        .map(([key, value]) => [key.replace(/(P|S)$/, ''), value])
    )

    // which is why we need an any cast here
    return Bacon.combineTemplate(transformedTemplate) as any
}

oegyCombineTemplate({
  paymentCardIdP: Bacon.constant("12356789"),
  showCookieConsentS: Bacon.repeatedly(1000, [true]),
}).map((x) => [x.paymentCardId, x.showCookieConsent]).log('Here is the data!');
