import React, { useState, useEffect } from 'react';
import AdminLayout from "../../components/layout/AdminLayout";
import AuthCheck from "../../components/auth/AuthCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Users, Mail, Send } from "lucide-react";
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from "../../lib/firebaseClient";

const NewsletterStats = ({ stats }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
        <p className="text-xs text-muted-foreground">
          {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth} from last month
        </p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
        <Mail className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.openRate}%</div>
        <p className="text-xs text-muted-foreground">
          {stats.openRateChange > 0 ? '+' : ''}{stats.openRateChange}% from last campaign
        </p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
        <BarChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.clickRate}%</div>
        <p className="text-xs text-muted-foreground">
          {stats.clickRateChange > 0 ? '+' : ''}{stats.clickRateChange}% from last campaign
        </p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
        <Send className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
        <p className="text-xs text-muted-foreground">{stats.monthlyCampaigns} sent this month</p>
      </CardContent>
    </Card>
  </div>
);

const ComposeNewsletter = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Input 
        type="text" 
        placeholder="Newsletter Subject" 
        className="text-lg font-medium"
      />
    </div>
    <div className="space-y-2">
      <Textarea 
        placeholder="Write your newsletter content here..." 
        className="min-h-[300px]"
      />
    </div>
    <div className="flex justify-end space-x-2">
      <Button variant="outline">Save Draft</Button>
      <Button>
        <Send className="mr-2 h-4 w-4" />
        Send Newsletter
      </Button>
    </div>
  </div>
);

const SubscriberList = ({ subscribers, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-4">Loading subscribers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input 
          type="search" 
          placeholder="Search subscribers..." 
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outline">Export List</Button>
      </div>
      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Subscribed Date</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map((subscriber) => (
              <tr key={subscriber.id} className="border-b">
                <td className="p-2">{subscriber.email}</td>
                <td className="p-2">{new Date(subscriber.subscribedAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    subscriber.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {subscriber.status.charAt(0).toUpperCase() + subscriber.status.slice(1)}
                  </span>
                </td>
                <td className="p-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    monthlyGrowth: 0,
    openRate: 0,
    openRateChange: 0,
    clickRate: 0,
    clickRateChange: 0,
    totalCampaigns: 0,
    monthlyCampaigns: 0
  });

  useEffect(() => {
    // Subscribe to newsletter_signups collection
    const q = query(
      collection(db, 'newsletter_signups'),
      orderBy('subscribedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subscriberData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubscribers(subscriberData);
      
      // Calculate stats
      const now = new Date();
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      
      const activeSubscribers = subscriberData.filter(sub => sub.status === 'active');
      const newSubscribers = subscriberData.filter(sub => 
        new Date(sub.subscribedAt) > monthAgo
      );

      setStats({
        totalSubscribers: activeSubscribers.length,
        monthlyGrowth: newSubscribers.length,
        openRate: 38.2, // Example engagement metrics
        openRateChange: 2.1,
        clickRate: 12.8,
        clickRateChange: 0.6,
        totalCampaigns: 32,
        monthlyCampaigns: 4
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthCheck>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Newsletter Management</h1>
          </div>
          
          <NewsletterStats stats={stats} />

          <Tabs defaultValue="compose" className="space-y-4">
            <TabsList>
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="compose" className="space-y-4">
              <ComposeNewsletter />
            </TabsContent>
            
            <TabsContent value="subscribers" className="space-y-4">
              <SubscriberList subscribers={subscribers} loading={loading} />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </AuthCheck>
  );
}