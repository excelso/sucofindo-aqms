<div class="form-group-control bg-white">
    <select class="form-control select2-custom {{ $class }}" name="{{ $name }}" id="{{ $id }}" {{ $disabled }} data-selected="{{ $selected }}">
        <option value="">...</option>
        @foreach($options as $item)
            @php($select = $item->id == $selected ? 'selected' : '')
{{--            @if(Auth::user()->employee->companiesDesignation->companiesDepartment->company_id == $item->id)--}}
{{--                @php($select = 'selected')--}}
{{--            @endif--}}
            <option value="{{ $item->id }}" {{ $select }}>{{ $item->company_name }}</option>
        @endforeach
    </select>
</div>
