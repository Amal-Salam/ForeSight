/* eslint-disable prettier/prettier */
import { Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout.js";
import Dashboard from "./Pages/Dashboard.js";
import PredictiveTimeline from "./Components/PredictiveTimeline.js";
import AcceptInvite from "./Components/AcceptInvite.js";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

export default function App() {
  return (
    <Routes>
      {/* invite route - outside Layout, no auth required to view */}
      <Route path = "/invite/:token" element = {<AcceptInvite/>}/>
      <Route path = "/*" element = {
        <>
      <SignedIn>
        <Layout>
          {(workspaceId) => (
            <Routes>
              <Route path="/" element={<Dashboard workspaceId={workspaceId} />} />
              <Route path="/timeline" element={<PredictiveTimeline workspaceId={workspaceId} />} />
            </Routes>
          )}
        </Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      </>
      }
      />
    </Routes>
    
  );
}