import { describe, expect, it } from "vitest"
import { latestOnly } from "./useBulkData"

const deferred = <T,>() => {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe("latestOnly", () => {
  it("leitura antiga que chega depois não vale; a última sempre entrega (e encerra o 'atualizando')", async () => {
    const got: string[] = []
    const read = latestOnly<string>((v) => got.push(v))
    const old = deferred<string>()
    const now = deferred<string>()
    const a = read(old.promise)
    const b = read(now.promise)
    now.resolve("nova")
    old.resolve("velha")
    expect(await b).toBe(true)
    expect(await a).toBe(false)
    expect(got).toEqual(["nova"])
  })
  it("a última entrega mesmo quando a anterior termina antes", async () => {
    const got: string[] = []
    const read = latestOnly<string>((v) => got.push(v))
    const first = deferred<string>()
    const second = deferred<string>()
    const a = read(first.promise)
    first.resolve("1")
    expect(await a).toBe(true)
    const b = read(second.promise)
    second.resolve("2")
    expect(await b).toBe(true)
    expect(got).toEqual(["1", "2"])
  })
})
