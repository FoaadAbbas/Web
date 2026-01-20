import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { UiProvider } from "./app/UiProvider";
import { AuthProvider } from "./app/auth/AuthProvider";
import { AppDataProvider } from "./app/data/AppDataProvider";
import { ThemeProvider } from "./app/ThemeProvider";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppDataProvider>
          <UiProvider>
            <RouterProvider router={router} />
          </UiProvider>
        </AppDataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
