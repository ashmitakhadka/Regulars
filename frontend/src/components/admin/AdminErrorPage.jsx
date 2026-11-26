import React from "react";
import { useNavigate, useRouteError } from "react-router-dom";
import { Card, Button } from "../ui";

export const AdminErrorPage = () => {
  const navigate = useNavigate();
  const error = useRouteError();

  return (
    <div className="min-h-screen bg-blush-50/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center shadow-md">
        <div className="w-12 h-12 rounded-full bg-red-50 text-brand-900 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          !
        </div>
        <h1 className="font-display text-xl font-bold text-brand-900 mb-2">
          Something went wrong on this page
        </h1>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">
          An unexpected error occurred while loading this admin view.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button variant="primary" onClick={() => navigate("/admin")}>
            Back to dashboard
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminErrorPage;
