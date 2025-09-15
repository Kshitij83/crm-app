'use client'

import { useState, useId } from 'react'
import { PlusCircle, X, ChevronDown, ChevronUp, Trash2, AlignJustify, Sparkles, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// Types for our rule builder
type Operator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with'
type LogicalOperator = 'and' | 'or'
type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'enum'

interface FieldOption {
  id: string
  name: string
  type: FieldType
  options?: string[] // For enum fields
}

interface Rule {
  id: string
  field: string
  operator: Operator
  value: string
}

interface RuleGroup {
  id: string
  logicalOperator: LogicalOperator
  rules: Rule[]
  groups: RuleGroup[]
}

// Map of operators that are valid for each field type
const validOperators: Record<FieldType, Operator[]> = {
  text: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'],
  number: ['equals', 'not_equals', 'greater_than', 'less_than'],
  date: ['equals', 'not_equals', 'greater_than', 'less_than'],
  boolean: ['equals', 'not_equals'],
  enum: ['equals', 'not_equals'],
}

// Human-readable operator labels
const operatorLabels: Record<Operator, string> = {
  equals: 'Equals',
  not_equals: 'Does not equal',
  contains: 'Contains',
  not_contains: 'Does not contain',
  greater_than: 'Greater than',
  less_than: 'Less than',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
}

// Sample field options for customer segmentation
const availableFields: FieldOption[] = [
  { id: 'name', name: 'Customer Name', type: 'text' },
  { id: 'email', name: 'Email Address', type: 'text' },
  { id: 'age', name: 'Age', type: 'number' },
  { id: 'totalSpend', name: 'Total Spend', type: 'number' },
  { id: 'lastPurchaseDate', name: 'Last Purchase Date', type: 'date' },
  { id: 'signupDate', name: 'Signup Date', type: 'date' },
  { id: 'isActive', name: 'Is Active Customer', type: 'boolean' },
  { id: 'hasOpenTickets', name: 'Has Open Support Tickets', type: 'boolean' },
  { id: 'country', name: 'Country', type: 'enum', options: ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Other'] },
  { id: 'deviceType', name: 'Device Type', type: 'enum', options: ['Desktop', 'Mobile', 'Tablet'] },
  { id: 'purchaseCount', name: 'Number of Purchases', type: 'number' },
  { id: 'gender', name: 'Gender', type: 'enum', options: ['Male', 'Female', 'Other', 'Prefer not to say'] },
];

interface RuleBuilderProps {
  initialRuleGroup?: RuleGroup
  onChange?: (ruleGroup: RuleGroup) => void
  onSave?: (ruleGroup: RuleGroup) => void
  onAiSuggest?: (description: string) => void
}

export function RuleBuilder({ 
  initialRuleGroup,
  onChange,
  onSave,
  onAiSuggest 
}: RuleBuilderProps) {
  const [ruleGroup, setRuleGroup] = useState<RuleGroup>(
    initialRuleGroup || {
      id: 'root',
      logicalOperator: 'and',
      rules: [createEmptyRule()],
      groups: []
    }
  )
  const [aiDescription, setAiDescription] = useState('')
  const [showAiInput, setShowAiInput] = useState(false)

  function createEmptyRule(): Rule {
    return {
      id: crypto.randomUUID(),
      field: availableFields[0].id,
      operator: validOperators[availableFields[0].type][0],
      value: ''
    }
  }

  function createEmptyGroup(): RuleGroup {
    return {
      id: crypto.randomUUID(),
      logicalOperator: 'and',
      rules: [createEmptyRule()],
      groups: []
    }
  }

  function updateRuleGroup(updatedGroup: RuleGroup) {
    setRuleGroup(updatedGroup)
    if (onChange) {
      onChange(updatedGroup)
    }
  }

  function handleRuleChange(ruleId: string, updatedRule: Partial<Rule>) {
    const updateRules = (group: RuleGroup): RuleGroup => {
      return {
        ...group,
        rules: group.rules.map(rule => 
          rule.id === ruleId ? { ...rule, ...updatedRule } : rule
        ),
        groups: group.groups.map(g => updateRules(g))
      }
    }
    
    const updated = updateRules(ruleGroup)
    updateRuleGroup(updated)
  }

  function handleAddRule(groupId: string) {
    const addRuleToGroup = (group: RuleGroup): RuleGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          rules: [...group.rules, createEmptyRule()]
        }
      }
      return {
        ...group,
        groups: group.groups.map(g => addRuleToGroup(g))
      }
    }
    
    const updated = addRuleToGroup(ruleGroup)
    updateRuleGroup(updated)
  }

  function handleRemoveRule(ruleId: string, groupId: string) {
    const removeRuleFromGroup = (group: RuleGroup): RuleGroup => {
      if (group.id === groupId) {
        // Don't remove if it's the only rule and there are no subgroups
        if (group.rules.length === 1 && group.groups.length === 0) {
          return group
        }
        return {
          ...group,
          rules: group.rules.filter(rule => rule.id !== ruleId)
        }
      }
      return {
        ...group,
        groups: group.groups.map(g => removeRuleFromGroup(g))
      }
    }
    
    const updated = removeRuleFromGroup(ruleGroup)
    updateRuleGroup(updated)
  }

  function handleAddGroup(parentGroupId: string) {
    const addGroupToParent = (group: RuleGroup): RuleGroup => {
      if (group.id === parentGroupId) {
        return {
          ...group,
          groups: [...group.groups, createEmptyGroup()]
        }
      }
      return {
        ...group,
        groups: group.groups.map(g => addGroupToParent(g))
      }
    }
    
    const updated = addGroupToParent(ruleGroup)
    updateRuleGroup(updated)
  }

  function handleRemoveGroup(groupId: string, parentGroupId: string) {
    const removeGroupFromParent = (group: RuleGroup): RuleGroup => {
      if (group.id === parentGroupId) {
        return {
          ...group,
          groups: group.groups.filter(g => g.id !== groupId)
        }
      }
      return {
        ...group,
        groups: group.groups.map(g => removeGroupFromParent(g))
      }
    }
    
    // Can't remove root group
    if (groupId === 'root') return
    
    const updated = removeGroupFromParent(ruleGroup)
    updateRuleGroup(updated)
  }

  function handleLogicalOperatorChange(groupId: string, logicalOperator: LogicalOperator) {
    const updateGroupOperator = (group: RuleGroup): RuleGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          logicalOperator
        }
      }
      return {
        ...group,
        groups: group.groups.map(g => updateGroupOperator(g))
      }
    }
    
    const updated = updateGroupOperator(ruleGroup)
    updateRuleGroup(updated)
  }

  function handleAiSuggest() {
    if (onAiSuggest && aiDescription.trim()) {
      onAiSuggest(aiDescription)
      setAiDescription('')
      setShowAiInput(false)
    }
  }

  function handleSave() {
    if (onSave) {
      onSave(ruleGroup)
    }
  }

  // Renders a single rule
  const RuleComponent = ({ 
    rule, 
    groupId 
  }: { 
    rule: Rule, 
    groupId: string 
  }) => {
    const field = availableFields.find(f => f.id === rule.field)
    const fieldType = field?.type || 'text'
    
    return (
      <div className="flex flex-wrap items-start gap-2 mb-2">
        <div className="flex-1 min-w-[150px]">
          <select
            value={rule.field}
            onChange={(e) => {
              const newField = e.target.value
              const fieldOption = availableFields.find(f => f.id === newField)
              const newOperator = fieldOption ? validOperators[fieldOption.type][0] : 'equals'
              
              handleRuleChange(rule.id, { 
                field: newField, 
                operator: newOperator,
                // Reset value when changing field
                value: ''
              })
            }}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800"
          >
            {availableFields.map(field => (
              <option key={field.id} value={field.id}>{field.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <select
            value={rule.operator}
            onChange={(e) => handleRuleChange(rule.id, { operator: e.target.value as Operator })}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800"
          >
            {field && validOperators[field.type].map(op => (
              <option key={op} value={op}>{operatorLabels[op]}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          {fieldType === 'enum' && field?.options ? (
            <select
              value={rule.value}
              onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800"
            >
              <option value="">Select...</option>
              {field.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : fieldType === 'boolean' ? (
            <select
              value={rule.value}
              onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-800"
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : (
            <Input
              type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
              value={rule.value}
              onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-1 text-sm"
              placeholder={`Enter ${field?.name || 'value'}`}
            />
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveRule(rule.id, groupId)}
          className="text-gray-500 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Recursive component to render rule groups
  const RuleGroupComponent = ({ 
    group, 
    parentGroupId, 
    depth = 0 
  }: { 
    group: RuleGroup, 
    parentGroupId?: string, 
    depth?: number 
  }) => {
    return (
      <div 
        className={`p-3 rounded-md border ${
          depth % 2 === 0 
            ? 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20' 
            : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50'
        } mb-2`}
      >
        {/* Group header with logical operator selection */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">
              {group.id === 'root' ? 'All conditions' : 'When'}
            </Label>
            
            <select
              value={group.logicalOperator}
              onChange={(e) => handleLogicalOperatorChange(group.id, e.target.value as LogicalOperator)}
              className="border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-gray-800"
            >
              <option value="and">ALL conditions are met (AND)</option>
              <option value="or">ANY condition is met (OR)</option>
            </select>
          </div>
          
          {group.id !== 'root' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveGroup(group.id, parentGroupId || 'root')}
              className="text-gray-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Rules within this group */}
        <div className="ml-2">
          {group.rules.map(rule => (
            <RuleComponent key={rule.id} rule={rule} groupId={group.id} />
          ))}
        </div>
        
        {/* Nested groups */}
        <div className="ml-4 mt-2">
          {group.groups.map(nestedGroup => (
            <RuleGroupComponent 
              key={nestedGroup.id} 
              group={nestedGroup} 
              parentGroupId={group.id} 
              depth={depth + 1} 
            />
          ))}
        </div>
        
        {/* Group actions */}
        <div className="flex flex-wrap gap-2 mt-3 ml-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddRule(group.id)}
            className="text-xs"
          >
            <PlusCircle className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddGroup(group.id)}
            className="text-xs"
          >
            <AlignJustify className="h-3 w-3 mr-1" />
            Add Group
          </Button>
        </div>
      </div>
    )
  }

  // Main return for the RuleBuilder component
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <RuleGroupComponent group={ruleGroup} />
      </div>
      
      {/* AI Suggestion input */}
      {showAiInput ? (
        <div className="flex items-start space-x-2 mt-4">
          <div className="flex-1">
            <Input
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Describe your segment in plain language, e.g., 'Customers who spent over $100 in the last month and are from the US'"
              className="w-full"
            />
          </div>
          <Button 
            onClick={handleAiSuggest}
            disabled={!aiDescription.trim()}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Generate Rules
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowAiInput(false)}
            className="text-gray-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button 
          variant="outline" 
          onClick={() => setShowAiInput(true)}
          className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          Generate Rules with AI
        </Button>
      )}
      
      {/* Save button */}
      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">
          <Save className="h-4 w-4 mr-1" />
          Save Segment
        </Button>
      </div>
    </div>
  )
}

// Export the RuleBuilder and its types
export type { Rule, RuleGroup, Operator, LogicalOperator, FieldOption }