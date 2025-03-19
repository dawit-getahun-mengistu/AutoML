import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

interface DefaultResponsesOptions {
  type?: Type<any>;
  endpointDescription?: string;
}

export function ApiDefaultResponses(options: DefaultResponsesOptions = {}) {
  const { type, endpointDescription } = options;

  return applyDecorators(
    ...(
      endpointDescription 
        ? [ApiOperation({ summary: endpointDescription })] 
        : []
    ),
    type
      ? ApiOkResponse({ description: 'Successful response', type })
      : ApiOkResponse({ description: 'Successful response' }),
    type
      ? ApiCreatedResponse({ description: 'Resource successfully created', type })
      : ApiCreatedResponse({ description: 'Resource successfully created' }),
    ApiBadRequestResponse({ description: 'Bad request' }),
    ApiInternalServerErrorResponse({ description: 'Internal server error' }),
  );
}
