import { publicProcedure } from '../../../index';
import { z } from 'zod';

export const helloProcedure = publicProcedure
  .input(z.object({ name: z.string() }))
  .query(({ input }) => {
    return {
      greeting: `Hello ${input.name}`,
    };
  });