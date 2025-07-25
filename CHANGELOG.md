# Changelog

## Unreleased

### 🐛 Bug Fixes

- **Fixed priority null handling in task updates (Issue #23)**:
  - Fixed `update_task` tool failing when setting priority to `null` to clear/remove priority
  - Modified `buildUpdateData` function to use `toTaskPriority` helper for proper null value conversion
  - Priority updates now work correctly for both setting valid values (1-4) and clearing priority (null)
  - Bulk task updates (`update_bulk_tasks`) already worked correctly and continue to function properly

- **Fixed subtasks not being retrieved (Issue #69)**:
  - Fixed `getSubtasks` method in `task-core.ts` to include required query parameters
  - Added `subtasks=true` and `include_subtasks=true` parameters to ClickUp API call
  - Subtasks are now properly retrieved and displayed when using `get_task` tool with `subtasks=true`
  - Resolves issue where subtasks arrays were always empty despite subtasks existing in ClickUp

## v0.8.3 (2025-07-03)

### 🚀 New Features & Improvements

- **Enhanced workspace tasks filtering with Views API support (Issue #43)**:
  - **Enhanced list filtering**: When `list_ids` are provided, `get_workspace_tasks` now uses ClickUp's Views API for comprehensive task coverage
  - **Multi-list task support**: Now retrieves tasks that are *associated with* specified lists, including tasks created elsewhere and added to multiple lists
  - **Two-tier filtering strategy**:
    - **Server-side filtering**: Supported filters applied at ClickUp API level for efficiency (statuses, assignees, dates, etc.)
    - **Client-side filtering**: Additional filters applied after data retrieval (tags, folder_ids, space_ids)
  - **API endpoints used**:
    - `GET /list/{listId}/view` - Retrieves list views and identifies default list view
    - `GET /view/{viewId}/task` - Retrieves all tasks associated with the view/list
  - **Performance optimizations**:
    - Concurrent API calls for multiple lists using `Promise.all()`
    - Task deduplication to prevent duplicate results
    - Automatic summary format switching for large result sets
    - Safety limits to prevent infinite pagination loops
  - **Robust error handling**: Graceful degradation when some lists fail, comprehensive logging
  - **Backward compatibility**: Existing functionality unchanged when `list_ids` not provided
  - **Impact**: Addresses ClickUp's "tasks in multiple lists" feature, providing complete task coverage for list-based queries

    Thanks @dantearaujo for the help!

- **Added ENABLED_TOOLS configuration option (PR #39 & Issue #50)**:
  - Added `ENABLED_TOOLS` environment variable and command line argument support
  - Allows specifying exactly which tools should be available via comma-separated list
  - Provides complementary functionality to existing `DISABLED_TOOLS` option
  - **Precedence logic**: `ENABLED_TOOLS` takes precedence over `DISABLED_TOOLS` when both are specified
  - **Configuration options**:
    - `ENABLED_TOOLS=tool1,tool2` - Only enable specified tools
    - `DISABLED_TOOLS=tool1,tool2` - Disable specified tools (legacy approach)
    - If neither specified, all tools are available (default behavior)
  - **Enhanced tool filtering**:
    - Updated `ListToolsRequestSchema` handler to use new filtering logic
    - Updated `CallToolRequestSchema` handler with improved error messages
    - Clear distinction between "disabled" vs "not in enabled tools list" errors
  - **Impact**: Users can now precisely control tool availability for security, context limitations, or workflow optimization
  - **Backward compatibility**: Existing `DISABLED_TOOLS` functionality unchanged

  Thanks @somework & @colinmollenhour for the help!

### 🛠️ Bug Fixes

- **Fixed automatic priority assignment in task creation**:
  - Fixed issue where `create_task` and `create_bulk_tasks` tools were automatically setting priorities even when users didn't specify one
  - **Root cause**: Priority field was unconditionally included in API requests as `undefined`, which ClickUp interpreted as a request to set a default priority
  - **Solution**: Priority field is now only included in API requests when explicitly provided by the user
  - **Impact**: Tasks created without specifying a priority will now have `priority: null` instead of an automatically assigned priority
  - **Affected tools**: `create_task_ClickUp__Local_` and `create_bulk_tasks_ClickUp__Local_`
  - **Backward compatibility**: Tasks created with explicit priority values continue to work unchanged

## v0.8.2 (2025-06-12)

### 🚀 New Features & Improvements

### �🛠️ Bug Fixes

- **Fixed task assignment feature not working (Issue #48)**:
  - Fixed critical bug where task assignees were not being properly assigned despite successful API responses
  - Root cause: Missing assignee resolution logic in task creation and update handlers
  - Added comprehensive assignee resolution supporting multiple input formats:
    - Numeric user IDs (e.g., `96055451`)
    - Email addresses (e.g., `"user@example.com"`)
    - Usernames (e.g., `"John Doe"`)
    - Mixed format arrays (e.g., `[96055451, "user@example.com"]`)
  - Enhanced task handlers with automatic assignee resolution:
    - `create_task` - Now resolves assignees before task creation
    - `update_task` - Now resolves assignees during task updates
    - `create_bulk_tasks` - Now resolves assignees for each task in bulk operations
  - Added proper deduplication for duplicate assignees in mixed format requests
  - Added graceful error handling for unresolvable assignees (continues with resolved ones)
  - **Impact**: Task assignment now works correctly for all documented assignee formats
  - **Supported formats**: User IDs, email addresses, usernames, and mixed arrays

- **Fixed task due date updates not working (Issue #49)**:
  - Fixed critical bug where `update_task` returned success but didn't actually update due dates
  - Root cause: `updateTaskHandler` was not calling `buildUpdateData()` to parse date strings into timestamps
  - Enhanced natural language date parsing to support complex formats:
    - Added support for day names: "Monday", "Friday", "Saturday", etc.
    - Added time parsing: "Monday at 3pm EST", "Friday at 2:30pm", etc.
    - Added "next" prefix handling: "next Friday", "next Monday", etc.
    - Improved fallback parsing with multiple strategies and validation
  - **Impact**: Due date updates now work correctly for all supported date formats
  - **Supported formats**: "tomorrow", "Monday at 3pm EST", "next Friday", Unix timestamps, "MM/DD/YYYY", relative times like "2 hours from now"

- **Fixed subtask visibility in workspace tasks (Issue #56)**:
  - Added missing `subtasks` parameter to `get_workspace_tasks` tool
  - Added missing `include_subtasks`, `include_compact_time_entries`, and `custom_fields` parameters for completeness
  - Updated tool description to clarify how subtasks parameter works with filtering
  - **Impact**: Users can now access subtasks through workspace-wide queries when subtasks match filter criteria
  - **Note**: Subtasks must still match other filter criteria (tags, lists, etc.) to appear in results
  - **Alternative**: Use `get_task` tool with `subtasks=true` to see all subtasks of a specific task regardless of filters

### 🔗 References

- #48: [Task Assignment Feature Not Working through ClickUp MCP Integration API](https://github.com/taazkareem/clickup-mcp-server/issues/48)
- #49: [update_task not updating due dates](https://github.com/taazkareem/clickup-mcp-server/issues/49)
- #56: [Can't see sub-tasks](https://github.com/taazkareem/clickup-mcp-server/issues/56)
## v0.8.1 (2025-06-12)

### 🛠️ Critical Bug Fixes

- **Fixed JSON Schema Validation Error**:
  - Resolved server startup failure with error: `Invalid schema for tool list_document_pages: strict mode: unknown keyword: "optional"`
  - Removed invalid `optional: true` keywords from document tool schemas
  - Fixed schemas for: `list_document_pages`, `get_document_pages`, `create_document_page`, `update_document_page`
  - **Technical Note**: In JSON Schema, optional properties are defined by omitting them from the `required` array, not by using an `optional` keyword
  - **Impact**: Server now starts correctly without schema validation errors

### 🔄 Repository Updates

- Updated document tool schemas to comply with strict JSON Schema validation
- Ensured all tools load properly and are fully functional
- Maintained zero breaking changes - all existing functionality preserved

## v0.8.0 (2025-06-12)

### 🚀 Major Features & Architectural Improvements

- **HTTP Streamable Transport Support**:
  - Added HTTP Streamable transport implementation for modern web-based integrations
  - Dual transport support: can run both STDIO and HTTP/SSE simultaneously
  - New configuration options:
    - `ENABLE_SSE` - Enable HTTP/SSE transport (default: false)
    - `PORT` - HTTP server port (default: 3231)
    - `ENABLE_STDIO` - Enable STDIO transport (default: true)
  - HTTP server endpoints:
    - `/mcp` - HTTP Streamable endpoint for MCP protocol communication
    - `/sse` - Legacy SSE endpoint for backwards compatibility
  - Enhanced integration capabilities:
    - MCP Inspector compatibility
    - Web application compatibility
    - Multiple client connection support
    - Session management for stateful interactions

- **Massive Codebase Refactor & Optimization**:
  - **70% total codebase reduction** (1,566 → 466 lines)
  - **Eliminated 1,100+ lines of duplicated tool definitions** (89% reduction in SSE server)
  - Unified server architecture eliminating code duplication
  - Single source of truth for server configuration
  - Clean separation between server logic and transport setup
  - Improved maintainability and extensibility

- **Member Management Tools**:
  - Added `get_workspace_members` - Retrieve all workspace members with details
  - Added `find_member_by_name` - Find specific members by name or email
  - Added `resolve_assignees` - Resolve user IDs/emails to assignee objects
  - Enhanced task creation with `assignees` parameter for user assignment
  - **Enhanced task updating with `assignees` parameter** for both single and bulk operations
  - Support for assignees in create, update, and bulk operations (create/update)
  - Improved error handling and response formatting for member operations

### 🔄 Repository Updates

- Refactored transport architecture for unified server configuration
- Enhanced configuration system for transport selection
- Improved imports and code organization for maintainability
- Updated tool schemas to support assignees parameter
- Comprehensive testing across all transport types

## v0.7.2 (2025-04-25)

### 🛠️ Bug Fixes

- Fixed time estimate support in task updates:
  - Removed redundant field-specific validation check in task update operations
  - Simplified validation to check only for the presence of update fields
  - Fixed "At least one field to update must be provided" error when using time_estimate
  - Added time string parsing for converting formats like "2h 30m" to minutes
  - Improved tool description for clear guidance on supported formats
  - Ensures compatibility with all fields defined in the UpdateTaskData type

### 🔗 References

- #45: [Bug: Time estimates not allowed when updating tasks](https://github.com/taazkareem/clickup-mcp-server/issues/45)

## v0.7.1 (2025-04-24)

### 🚀 New Features & Improvements

- Added Documents Module with comprehensive document management:
  - Document listing and search across workspace
  - Document creation with customizable visibility
  - Document page management (create, list, get, update)
  - Optional module activation via `DOCUMENT_SUPPORT=true` environment variable
  - Support for both API V2 and V3 endpoints
- Added comprehensive Time Tracking functionality:
  - View time entries for tasks with filtering options
  - Start/stop time tracking on tasks
  - Add manual time entries with flexible duration formats
  - Delete time entries
  - View currently running timer with elapsed time information
  - Track billable and non-billable time
- Added command disabling capability:
  - New `DISABLED_TOOLS` environment variable
  - Disable specific commands via comma-separated list
  - Support for both environment variable and command line argument
  - Improved security through selective command access
  - Clear error messages for disabled command attempts

### 🛠️ Bug Fixes & Improvements

- Fixed custom task ID lookup in `getTaskByCustomId` method:
  - Corrected API endpoint from `/task/custom_task_ids` to `/task/{id}` with proper parameters
  - Added required `custom_task_ids=true` and `team_id` parameters for proper authentication
  - Fixed "Authorization failed" error when retrieving tasks by custom ID
  - Improved error handling and logging for custom ID operations
- Fixed JSON schema type definitions in task tools for improved compatibility with third-party parsers:
  - Updated schema to use single string type with nullable property instead of array types
  - Ensures compatibility with Go-based parsers like windsurf that have strict type requirements
  - Affected tools: `update_task`, `update_bulk_tasks`
- Enhanced custom field handling in task updates:
  - Fixed issue with custom field updates not being properly applied
  - Improved validation and processing of custom field values
  - Ensures consistent behavior across all task update operations

### 🔄 Repository Updates

- Updated documentation with new document module features
- Added configuration guide for disabled commands
- Enhanced API reference with document management examples
- Added documentation for time tracking tools
- Improved API reference accuracy for task update operations

### 🔗 References

- #37: [Fix authorization issue with custom task IDs](https://github.com/taazkareem/clickup-mcp-server/issues/37)
- #36: [Fix types for windsurf compatibility](https://github.com/taazkareem/clickup-mcp-server/pull/36)
- #38: [Add time tracking functionality](https://github.com/taazkareem/clickup-mcp-server/pull/38)
- #39: [Add command disabling capability](https://github.com/taazkareem/clickup-mcp-server/pull/39)
- #40: [Fix custom field updates](https://github.com/taazkareem/clickup-mcp-server/pull/40)
- #41: [Add document module](https://github.com/taazkareem/clickup-mcp-server/pull/41)

## v0.6.9 (2025-04-03)

### 🚀 New Features & Improvements

- Enhanced token limit protection for workspace tasks:
  - Added handler-level token limit validation (50,000 tokens)
  - Implemented smart response format switching
  - Automatic fallback to summary format for large responses
  - Improved token estimation for task responses
  - Added logging for format switching events
  - Double-layer protection at both service and handler levels

### 🔄 Repository Updates

- Updated task handler implementation with token limit checks
- Added token estimation utilities for task responses

## v0.6.6 (2025-04-03)

### 🐛 Bug Fixes

- Fixed task caching issue causing rate limits:
  - Task IDs from name lookups weren't being shared between sequential operations
  - Each tool operation was performing redundant global task searches
  - Added task name-to-ID mapping in cache to prevent duplicate lookups
  - Improved caching efficiency for sequential operations on same task

## v0.6.5 (2025-03-28)

- Added start date support for tasks:
  - Set task start dates with natural language expressions (e.g., "now", "tomorrow at 9am")
  - Support for both creation and updates via `startDate` parameter
  - Proper time handling with `start_date_time` flag
- Added Global Task Lookup feature:
  - Find tasks by name across the entire workspace without specifying a list
  - Smart disambiguation when multiple tasks share the same name
  - Context-aware results showing list, folder, and space for each match
  - Default selection of most recently updated task when multiple matches exist
  - Backward compatible with list-specific lookups
  - Applied to all task operations: get_task, update_task, delete_task, etc.
  - Improved error messages with actionable information for disambiguation

### 🚀 Performance Optimizations

- Implemented parallel request optimization for task operations:
  - Parallel validation of tasks and lists in move operations
  - Concurrent processing of task and list data
- Added task validation caching:
  - 5-minute TTL cache for task and list validations
  - Reduced redundant API calls in bulk operations
  - Optimized cache updates after successful operations
- Enhanced workspace hierarchy fetching:
  - Implemented batched space processing (3 spaces at a time)
  - Added batched folder processing (5 folders at a time)
  - Improved rate limit compliance with controlled concurrency
  - Added detailed performance logging and metrics

## v0.6.2 (2025-03-27)

### 🛠️ Bug Fixes

- Fixed binary execution issue by adding proper shebang line to the main executable

### 🚀 New Features & Improvements

- Added tag support with tools for:
  - Managing tags at the space level (get, create, update, delete)
  - Adding/removing tags from tasks
  - Support for tags when creating and updating tasks
- Enhanced bulk task creation with tags support
- Added natural language color processing for tags:
  - Create tags with color names (e.g., "blue", "red", "yellow")
  - Support for color variations (e.g., "dark blue", "light green")
  - Automatic generation of contrasting foreground colors
  - Color commands in both tag creation and updates
- Added `get_workspace_tasks` tool for retrieving filtered workspace tasks by various criteria:
  - Requires at least one filter parameter (tags, list_ids, space_ids, etc.)
  - Supports filtering by tags, due dates, status, and more
  - Includes pagination and sorting options
  - Implements Adaptive Response Format with two detail levels:
    - `summary`: Lightweight response with essential task information
    - `detailed`: Complete task information with all fields (default)
  - Automatic format selection based on response size (50,000 token threshold)
  - Optimized for handling large datasets efficiently

### 🔄 Repository Updates

- Updated documentation to reflect new tool requirements and capabilities
- Improved API reference with detailed examples and response formats

## v0.6.0 (2025-03-26)

### 🚀 New Features & Improvements

- Added subtasks support with multi-level nesting capability
- Implemented parent parameter for creating subtasks
- Made logging level configurable via environment variable or command line
- Fixed custom task ID handling across all operations
- Default log level now set to ERROR for improved compatibility

### 📦 Dependencies

- No dependency changes in this release

### 🔄 Repository Updates

- Updated documentation for subtasks feature
- Improved API reference with subtasks examples
- Added Security Policy and Code of Conduct

### 🔗 References

- #18: [See pull request](https://github.com/taazkareem/clickup-mcp-server/pull/18)
- #20: [See pull request](https://github.com/taazkareem/clickup-mcp-server/pull/20)

## v0.5.1 (2025-03-23)

### 🚀 New Features & Improvements

- Added support for Custom IDs across all tools
- New tools:
  - `attach_task_file`: Attach files to tasks using local paths, URLs, or base64 data
  - `create_task_comment`: Add comments to tasks
  - `get_task_comments`: Retrieve comments from tasks
- Enhanced date parsing with support for "X minutes from now" expressions
- Improved task name matching with greater flexibility:
  - Case-insensitive matching
  - Partial name matching
  - Matching without emojis
- Fixed error response formatting in task comment retrieval
- Improved workspace hierarchy display to correctly show lists directly in spaces

### 📦 Dependencies

- Updated dependencies to use semantic versioning
- Upgraded:
  - @modelcontextprotocol/sdk: 0.6.0 → 0.6.1
  - axios: 1.6.7 → 1.8.4
  - dotenv: 16.4.1 → 16.4.7

### 🔄 Repository Updates

- Added automated changelog generation
- Updated documentation and README
- Added funding options through GitHub Sponsors and Buy Me A Coffee

## v0.5.0 (2025-03-22)

### 🚀 Initial Release

- First public version of ClickUp MCP Server
- Core functionality for task, list, and folder management
- Basic workspace hierarchy navigation
- NPM and Smithery deployment options

### 🔄 Repository Updates

- Initial README and documentation
- Added GitHub workflow for publishing
- Created Funding options through GitHub Sponsors and Buy Me a Coffee

### 🔗 References

- #12: [See pull request](https://github.com/taazkareem/clickup-mcp-server/pull/12)
