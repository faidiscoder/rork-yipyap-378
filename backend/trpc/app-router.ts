import { router } from './trpc';
import { exampleRouter } from './routes/example/router';
import { usersRouter } from './routes/users/router';
import { schoolsRouter } from './routes/schools/router';
import { authRouter } from './routes/auth/router';
import { chatsRouter } from './routes/chats/router';
import { partiesRouter } from './routes/parties/router';
import { storiesRouter } from './routes/stories/router';

export const appRouter = router({
  example: exampleRouter,
  users: usersRouter,
  schools: schoolsRouter,
  auth: authRouter,
  chats: chatsRouter,
  parties: partiesRouter,
  stories: storiesRouter,
});

export type AppRouter = typeof appRouter;