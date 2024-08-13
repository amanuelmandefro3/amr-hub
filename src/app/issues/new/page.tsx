'use client';
import React from 'react';
import {TextArea, TextField, Button } from '@radix-ui/themes';

const NewIssuePage = () => {
  return (
    <div className ="max-w-xl space-y-4">
      <TextField.Root placeholder="Title"/>
      <TextArea placeholder="description" />
      <Button>Submit new Issue</Button>
      
    </div>
  );
};

export default NewIssuePage;
