import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/Sidebar";
import FloatingChatbot from "@/components/FloatingChatbot";
import { Phone, Mail, MapPin, GraduationCap, Building2, Briefcase } from "lucide-react";

const CATEGORIES = [
  "Client Hiring",
  "Technical Hiring",
  "Talent Acquisition Executive",
  "Medical Coding"
];

export default function HRWorkspace() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/my/leads"],
    queryFn: async () => {
      const res = await fetch("/api/my/leads", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
    retry: false,
  });

  if (isLoading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-cyan-50 dark:from-green-950 dark:to-cyan-950 rounded-lg p-6 shadow-sm border border-green-200 dark:border-green-800">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome, {user?.fullName || user?.email}</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage your assigned leads</p>
          </div>

          {/* Leads List */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-cyan-50 dark:from-green-950 dark:to-cyan-950 border-b">
              <CardTitle className="text-green-700 dark:text-green-300">My Assigned Leads</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {leadsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : !leads?.leads || leads.leads.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No leads available in this category</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.leads.map((lead: any) => (
                    <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{lead.name}</h3>
                          <Badge className="mt-1" variant={lead.status === 'new' ? 'default' : 'secondary'}>
                            {lead.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.location && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4" />
                            <span>{lead.location}</span>
                          </div>
                        )}
                        {lead.degree && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <GraduationCap className="w-4 h-4" />
                            <span>{lead.degree}</span>
                          </div>
                        )}
                        {lead.domain && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Briefcase className="w-4 h-4" />
                            <span>{lead.domain}</span>
                          </div>
                        )}
                        {lead.collegeName && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Building2 className="w-4 h-4" />
                            <span>{lead.collegeName}</span>
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Notes:</span> {lead.notes}
                        </div>
                      )}

                      <Button
                        className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => navigate("/my-leads")}
                        data-testid={`button-view-lead-${lead.id}`}
                      >
                        View Details & Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <FloatingChatbot />
    </div>
  );
}
