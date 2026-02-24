import 'reflect-metadata';

// Metadata key for storing config namespace
const CONFIG_NAMESPACE_KEY = Symbol('config:namespace');

/**
 * Decorator to register a configuration class with a namespace
 * @param namespace - The namespace for this config (e.g., 'app', 'database')
 */
export function ConfigNamespace(namespace: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(CONFIG_NAMESPACE_KEY, namespace, constructor);
    return constructor;
  };
}

/**
 * Get the namespace for a config class
 */
export function getConfigNamespace(target: Function): string | undefined {
  return Reflect.getMetadata(CONFIG_NAMESPACE_KEY, target);
}

/**
 * Decorator for providing default values to config properties
 */
export function Default(value: any) {
  return function (target: any, propertyKey: string) {
    // Store default value in metadata
    Reflect.defineMetadata('config:default', value, target, propertyKey);
  };
}

/**
 * Get default value for a property
 */
export function getDefaultValue(target: any, propertyKey: string): any {
  return Reflect.getMetadata('config:default', target, propertyKey);
}
