import { publicProcedure } from '../../../index';

export const hiProcedure = publicProcedure.query(() => {
  return {
    greeting: 'hi from tRPC',
  };
});