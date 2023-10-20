import { describe, expect, test } from "bun:test";

import * as r from "./index.js";

describe("Result型のテスト", () => {
  describe("Success型のテスト", () => {
    // type check
    const x: r.Success<1> = { type: "success", value: 1 };

    test('succeed関数の返り値は`type: "success"`を持つ', () => {
      // type check
      const y: r.Success<1> = r.succeed(1);
      expect(y).toStrictEqual(x);
    });

    const title1 =
      "isSuccess function return true when Success type is taken as argument";
    test(title1, () => {
      const x = r.succeed(true);

      if (!r.isSuccess(x)) {
        throw new Error(title1);
      }
      // type check
      expect(x.value).toBe(true);
    });

    const title2 =
      "isSuccess function return false when Failure type is taken as argument";
    test(title2, () => {
      const x = r.fail(false);

      if (r.isSuccess(x)) {
        throw new Error(title2);
      }
      // type check
      expect(x.cause).toBe(false);
    });
  });

  describe("Failure型のテスト", () => {
    test('fail関数は`type: "failure"`を返す', () => {
      expect(r.fail("fuga")).toStrictEqual({ type: "failure", cause: "fuga" });
    });

    test("failTyped関数は`cause: {type: string}`を返す", () => {
      expect(r.failTyped("fuga")).toStrictEqual({
        type: "failure",
        cause: { type: "fuga" },
      });
    });

    test("failTyped関数は第2引数を持つとき`cause: {type: string. value: any}`を返す", () => {
      expect(r.failTyped("hoge", "fuga")).toStrictEqual({
        type: "failure",
        cause: { type: "hoge", value: "fuga" },
      });
    });

    test("isFailure関数はFailure型の時trueを返す", () => {
      expect(
        r.isFailure({
          type: "failure",
          cause: { type: "hoge" },
        }),
      ).toBe(true);
    });

    test("isFailure関数はTypedFailure型の時trueを返す", () => {
      expect(
        r.isFailure({
          type: "failure",
          cause: { type: "hoge" },
        }),
      ).toBe(true);
    });

    test("isFailure関数はSuccess型の時falseを返す", () => {
      expect(
        r.isFailure({ type: "success", value: "hoge" } as r.Success<"hoge">),
      ).toBe(false);
    });
  });

  describe("ユーティリティ関数のテスト", () => {
    describe("unwrap関数のテスト", () => {
      test("unwrap関数はSuccess型の値を受け取った時、valueプロパティの値を返す", () => {
        expect(r.unwrap(r.succeed(1))).toBe(1);
      });

      test("unwrap関数はFailure型の値を受け取った時、例外を投げる", () => {
        expect(() => r.unwrap(r.fail(1))).toThrow();
      });
    });

    describe("map関数のテスト", () => {
      const f = r.map((v: number) => v + 1);

      test("map関数はSuccess型の値を受け取った時、引数の関数を実行してSuccess型を返す", () => {
        expect(f(r.succeed(1))).toStrictEqual(r.succeed(2));
      });

      test("map関数はFailure型の値を受け取った時、そのままFailure型を返す", () => {
        expect(f(r.fail("error"))).toStrictEqual(r.fail("error"));
      });
    });

    describe("mapError関数のテスト", () => {
      const f = r.mapError((v: number) => v + 1);

      test("mapError関数はSuccess型の値を受け取った時、そのままSuccess型を返す", () => {
        expect(f(r.succeed(1))).toStrictEqual(r.succeed(1));
      });

      test("mapError関数はFailure型の値を受け取った時、関数を実行してSuccess型を返す", () => {
        expect(f(r.fail(1))).toStrictEqual(r.succeed(2));
      });
    });

    describe("flatMap関数のテスト", () => {
      const f = r.flatMap((v: number) => {
        switch (v) {
          case 1:
            return r.succeed(v + 1);
          default:
            return r.fail("error");
        }
      });

      test("flatMap関数はSuccess型の値を受け取った時、引数の関数を実行してSuccess型を返す", () => {
        expect(f(r.succeed(1))).toStrictEqual(r.succeed(2));
      });

      test("flatMap関数はSuccess型の値を受け取った時、引数の関数を実行してFailure型を返す", () => {
        expect(f(r.succeed(2))).toStrictEqual(r.fail("error"));
      });

      test("flatMap関数はFailure型の値を受け取った時、そのままFailure型を返す", () => {
        expect(f(r.fail(1))).toStrictEqual(r.fail(1));
      });
    });

    describe("flatMapError関数のテスト", () => {
      const f = r.flatMapError((v: number) => {
        switch (v) {
          case 1:
            return r.succeed(v + 1);
          default:
            return r.fail("error");
        }
      });

      test("flatMapError関数はSuccess型の値を受け取った時、そのままSuccess型を返す", () => {
        expect(f(r.succeed(1))).toStrictEqual(r.succeed(1));
      });

      test("flatMapError関数はFailure型の値を受け取った時、引数の関数を実行してSuccess型を返す", () => {
        expect(f(r.fail(1))).toStrictEqual(r.succeed(2));
      });

      test("flatMapError関数はFailure型の値を受け取った時、引数の関数を実行してFailure型を返す", () => {
        expect(f(r.fail(2))).toStrictEqual(r.fail("error"));
      });
    });

    describe("tryCatch関数のテスト", () => {
      test("tryCatch関数は例外が投げられなければ、Success型を返す", () => {
        expect(
          r.tryCatch(
            () => 1 + 1,
            () => "error",
          ),
        ).toStrictEqual(r.succeed(2));
      });

      test("tryCatch関数は例外が投げられた時、Failure型を返す", () => {
        expect(
          r.tryCatch(
            () => {
              throw 1;
            },
            () => "error",
          ),
        ).toStrictEqual(r.fail("error"));
      });
    });

    describe("tryCatchAsync関数のテスト", () => {
      test("tryCatchAsync関数は非同期関数で例外が投げられなければ、PromiseLike<Success>型を返す", async () => {
        expect(
          await r.tryCatchAsync(
            async () => 1 + 1,
            () => "error",
          ),
        ).toStrictEqual(r.succeed(2));
      });

      test("tryCatchAsync関数は非同期関数で例外が投げられると、PromiseLike<Failure>型を返す", async () => {
        expect(
          await r.tryCatchAsync(
            async () => {
              throw 1;
            },
            () => "error",
          ),
        ).toStrictEqual(r.fail("error"));
      });
    });
  });
});
