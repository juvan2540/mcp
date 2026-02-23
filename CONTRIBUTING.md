# Contributing to MarkdownLM MCP Server

Thank you for your interest in contributing to the MarkdownLM MCP server! We welcome community contributions to make this integration as flexible and reliable as possible.

## Architecture and Scope

This repository contains the **bridge** (the Model Context Protocol client), not the **brain**. The core of the MarkdownLM intelligence—including the Retrieval-Augmented Generation (RAG) logic, validation algorithms, and private knowledge databases—lives securely on the MarkdownLM backend.

**The primary goal of this repository is to act as a secure, lightweight connector.**

## Development Setup

1. Clone the repository
2. Run `npm install`
3. Make your changes in `src/`
4. Run `npm run build` and test locally using `npm run dev`

All changes that touch the SDK or add new arguments must be well-documented.

## Code Review

All PRs require review from a core MarkdownLM maintainer before merging. Thank you for keeping our ecosystem secure!
