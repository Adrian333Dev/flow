/** Lets what is under way run: the mod's types declare no `setTimeout`, and a few hundred turns of the microtask queue settle what a test started. */
export async function flush(): Promise<void> {
  for (let i = 0; i < 300; i++) await Promise.resolve()
}
