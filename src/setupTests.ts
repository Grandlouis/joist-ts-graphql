import { EntityManager } from "src/entities";
import { toMatchEntity } from "joist-test-utils";
import { AppContext, newAppContext, Context } from "src/context";
import "src/setupIt";

let appContext: AppContext | undefined = undefined;
let appContextPromise: Promise<AppContext>;
export let numberOfQueries = 0;
export let queries: string[] = [];

export async function getAppContext(): Promise<AppContext> {
  if (!appContext) {
    appContextPromise ??= newAppContext().then((ctx) => {
      ctx.knex.on("query", (e: any) => {
        queries.push(e.sql);
      });
      return ctx;
    });
    appContext = await appContextPromise;
  }
  return appContext!;
}

beforeEach(async () => {
  const { knex } = await getAppContext();
  await knex.select(knex.raw("flush_database()"));
});

afterAll(async () => {
  await (await getAppContext()).close();
});

type ContextOpts = Partial<Context>;

export async function createTestContext(opts: ContextOpts = {}): Promise<Context> {
  resetQueries();
  const appContext = await getAppContext();
  const ctx = { ...appContext };
  const em = opts.em ?? new EntityManager(ctx as Context, appContext.driver);
  const req = null!;
  return Object.assign(ctx, { em, req });
}

export async function newEntityManager() {
  resetQueries();
  const appContext = await getAppContext();
  return new EntityManager(appContext as Context, appContext.driver);
}

export function resetQueries() {
  queries = [];
}

export async function select(tableName: string): Promise<readonly any[]> {
  return (await getAppContext()).knex.select("*").from(tableName).orderBy("id");
}

expect.extend({ toMatchEntity });
