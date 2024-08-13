import React from 'react'
import { Button } from '@radix-ui/themes'
import Link from 'next/link'


const IssuesPage = () => {
  return (
    <div>
      IssuesPage
      <Button><Link href="/issues/new">Add New Issue</Link></Button>
    </div>
  )
}

export default IssuesPage