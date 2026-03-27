import { router } from '../../trpc';
import { hiProcedure } from './hi/route';
import { helloProcedure } from './hello/route';

export const exampleRouter = router({
  hi: hiProcedure,
  hello: helloProcedure,
});