"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBolt,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import useStore from "@/store/store"


export function AppSidebar({
  ...props
}) {
  const {username, email, avatar}= useStore();
  const data = {
    user: {
      name: username,
      email: email,
      avatar: avatar,
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Quick Create",
        url: "/dashboard/quick-create",
        icon: IconBolt,
      },
      {
        title: "Generate Assessment",
        url: "/dashboard/generate-assessment",
        icon: IconListDetails,
      },
      {
        title: "My Assessments",
        url: "/dashboard/my-assessments",
        icon: IconFileDescription,
      },
      {
        title: "Curriculum Manager",
        url: "/dashboard/curriculum-manager",
        icon: IconFolder,
      },
      {
        title: "Reports",
        url: "/dashboard/reports",
        icon: IconReport,
      },
    ],
    navClouds: [
      {
        title: "Capture",
        icon: IconCamera,
        isActive: true,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
      {
        title: "Proposal",
        icon: IconFileDescription,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
      {
        title: "Prompts",
        icon: IconFileAi,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: IconSettings,
      },
      {
        title: "Get Help",
        url: "/dashboard/help",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "/dashboard/search",
        icon: IconSearch,
      },
    ]
  }
  return (
    (<Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">PaperGenie.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>)
  );
}
