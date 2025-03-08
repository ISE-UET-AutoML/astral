import { PATHS } from 'src/constants/paths';

import NonAuthed from 'src/layouts/nonAuthed';
import Home from 'src/pages/home';
import Login from 'src/pages/login';
import SignUp from 'src/pages/signup';

const routes = {
    element: <NonAuthed />,
    children: [
        {
            path: PATHS.ROOT,
            element: <Home />,
        },
        {
            path: PATHS.LOGIN,
            element: <Login />,
        },
        {
            path: PATHS.SIGNUP,
            element: <SignUp />,
        },
    ],
};

export default routes;
